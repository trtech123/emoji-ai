import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { nanoid } from "@/lib/utils"
import { GoogleGenAI } from "@google/genai"
import { replicate } from '@/server/replicate'
import { Translate } from '@google-cloud/translate/build/src/v2'

// Force Node.js runtime for this route
export const runtime = 'nodejs'

// Check for credentials
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
if (!credentials) {
  console.error("Missing Google Cloud credentials environment variable: GOOGLE_APPLICATION_CREDENTIALS_JSON")
  throw new Error("Missing Google Cloud credentials configuration")
}

// Parse credentials once
let parsedCredentials
try {
  parsedCredentials = JSON.parse(credentials)
  console.log("[DEBUG] Successfully parsed Google Cloud credentials from environment variable")
} catch (e) {
  console.error("Failed to parse Google Cloud credentials JSON:", e)
  throw new Error("Invalid Google Cloud credentials JSON format")
}

if (!process.env.GOOGLE_PROJECT_ID) { 
  console.error("Missing Vertex AI environment variable: GOOGLE_PROJECT_ID")
  throw new Error("Missing Vertex AI Project ID configuration")
}
if (!process.env.GOOGLE_LOCATION) { 
  console.error("Missing Vertex AI environment variable: GOOGLE_LOCATION")
  throw new Error("Missing Vertex AI Location configuration")
}
const project = process.env.GOOGLE_PROJECT_ID
const location = process.env.GOOGLE_LOCATION

// Initialize Vertex AI client with explicit auth options
const genAI = new GoogleGenAI({
  vertexai: true,
  project: project,
  location: location,
  googleAuthOptions: {
    credentials: parsedCredentials,
    projectId: project,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-translation'
    ]
  }
})
console.log(`[DEBUG] Initialized @google/genai SDK for Vertex AI (Project: ${project}, Location: ${location})`)

// Initialize Replicate
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("Missing Replicate environment variable: REPLICATE_API_TOKEN")
  throw new Error("Missing Replicate API Token configuration. Please set REPLICATE_API_TOKEN.")
}
console.log("[DEBUG] Initialized Replicate SDK")

// Initialize Translate with explicit auth
const translate = new Translate({
  credentials: parsedCredentials,
  projectId: parsedCredentials.project_id
})
console.log("[DEBUG] Initialized Google Cloud Translate V2 Client")

// Add type for prediction response
type ReplicateResponse = {
  data: {
    output: string[];
    removeBgData: {
      output: string;
    } | null;
  } | null;
  error: unknown | null;
}

export async function POST(request: Request) {
  const supabase = createClient() // Use server client
  let emojiId: string | null = null;

  try {
    // 1. Check User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Please log in to generate emojis." }, { status: 401 })
    }

    const body = await request.json()
    const { prompt: originalPrompt } = body // Only need prompt from body now

    if (!originalPrompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    emojiId = nanoid()

    // Translate prompt to English if needed
    const targetLanguage = 'en';
    const [translations] = await translate.translate(originalPrompt, targetLanguage) as [string | string[], any];
    const prompt = Array.isArray(translations) ? translations[0] : translations;

    // Create initial DB record
    const initialData = {
      id: emojiId,
      prompt: originalPrompt,
      status: 'pending',
      original_url: null,
      no_background_url: null,
      error: null,
    };

    try {
      const safetyRating = await replicate.classifyPrompt({ prompt });
      
      if (safetyRating >= 9) {
        return NextResponse.json({ error: "Nice try! Your prompt is inappropriate, let's keep it PG." }, { status: 400 });
      }

      const prediction: ReplicateResponse = await replicate.createEmoji(prompt, emojiId);
      
      if (prediction.error) {
        throw prediction.error;
      }

      const bgRemovedImageUrl = prediction.data?.removeBgData?.output;

      if (!bgRemovedImageUrl) {
        throw new Error('No image URL in Replicate response');
      }

      // Download image from Replicate
      const imageResponse = await fetch(bgRemovedImageUrl);
      if (!imageResponse.ok) throw new Error('Failed to fetch image from Replicate');
      const imageBuffer = await imageResponse.arrayBuffer();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('emojis')
        .upload(`${emojiId}.png`, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl: supabaseStorageUrl } } = supabase.storage
        .from('emojis')
        .getPublicUrl(`${emojiId}.png`);

      // Final DB update with all URLs
      const { error: finalUpdateError } = await supabase
        .from('emoji')
        .update({
          original_url: bgRemovedImageUrl,
          no_background_url: supabaseStorageUrl,
          status: 'generated'
        })
        .eq('id', emojiId);

      if (finalUpdateError) {
        throw new Error(`DB update failed: ${finalUpdateError.message}`);
      }

      return NextResponse.json({
        ...initialData,
        original_url: bgRemovedImageUrl,
        no_background_url: supabaseStorageUrl,
        status: 'generated'
      }, { status: 200 });

    } catch (error) {
      console.error('Error in emoji generation:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in emoji generation:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
} 

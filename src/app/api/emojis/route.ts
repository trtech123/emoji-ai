import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod" // Re-add zod import
import { nanoid } from "@/lib/utils"
// REMOVE: Cloudinary import
// import { v2 as cloudinary } from 'cloudinary'

// ADD: Google AI GenAI SDK imports (keep necessary ones)
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai"; // Keep safety types if used

// ADD: Replicate import
import Replicate from "replicate";

// ADD: Google Cloud Translate Client
import { Translate } from '@google-cloud/translate/build/src/v2';

// Force Node.js runtime for this route
export const runtime = 'nodejs';

// --- REMOVE Gemini API Key Initialization ---
// if (!process.env.GEMINI_API_KEY) { ... }
// const genAI_apiKey = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Check for credentials first since both services will need it
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!credentials) {
  console.error("Missing Google Cloud credentials environment variable: GOOGLE_APPLICATION_CREDENTIALS_JSON");
  throw new Error("Missing Google Cloud credentials configuration");
}

// Parse credentials once to avoid doing it multiple times
const parsedCredentials = JSON.parse(credentials);

if (!process.env.GOOGLE_PROJECT_ID) { 
  console.error("Missing Vertex AI environment variable: GOOGLE_PROJECT_ID");
  throw new Error("Missing Vertex AI Project ID configuration"); 
}
if (!process.env.GOOGLE_LOCATION) { 
  console.error("Missing Vertex AI environment variable: GOOGLE_LOCATION");
  throw new Error("Missing Vertex AI Location configuration"); 
}
const project = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_LOCATION;

// Initialize with explicit auth
const auth = {
  credentials: parsedCredentials,
  projectId: project,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/cloud-translation'
  ]
};

// Initialize Vertex AI
const genAI = new GoogleGenAI({
    vertexai: true,
    project: project,
    location: location,
});
console.log(`[DEBUG] Initialized @google/genai SDK for Vertex AI (Project: ${project}, Location: ${location})`);

// --- REMOVE Cloudinary Configuration ---
// if (!process.env.CLOUDINARY_CLOUD_NAME || ...) { ... }
// cloudinary.config({ ... });

// --- ADD Replicate Configuration ---
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("Missing Replicate environment variable: REPLICATE_API_TOKEN");
  throw new Error("Missing Replicate API Token configuration. Please set REPLICATE_API_TOKEN."); 
}
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
console.log("[DEBUG] Initialized Replicate SDK");

// Initialize Translate with explicit auth
const translate = new Translate(auth);
console.log("[DEBUG] Initialized Google Cloud Translate V2 Client");

// No need for JWT check here anymore, Supabase auth handles it
// const jwtSchema = z.object({ ... })

export async function POST(request: Request) {
  const supabase = createClient() // Use server client
  let emojiId: string | null = null; 
  let translatedPrompt: string | null = null; // Variable to hold translated text

  try {
    // 1. Check User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Please log in to generate emojis." }, { status: 401 })
    }

    const body = await request.json()
    const { prompt: originalPrompt } = body // Only need prompt from body now

    if (!originalPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    emojiId = nanoid()

    // --- ADD: Translate the Prompt --- 
    try {
      console.log(`[DEBUG ${emojiId}] Translating prompt to English: "${originalPrompt}"`);
      const targetLanguage = 'en';
      // Type assertion to help TypeScript understand the expected structure
      const [translations] = await translate.translate(originalPrompt, targetLanguage) as [string | string[], any];
      
      // Check if the result is an array (for multiple inputs) or a single string
      if (Array.isArray(translations)) {
        if (translations.length === 0 || !translations[0]) {
           throw new Error("Translation result array was empty or invalid.");
        }
        translatedPrompt = translations[0]; // Get the first translation if it was an array input
      } else if (typeof translations === 'string') {
        translatedPrompt = translations; // Use the string directly if single input
      } else {
         throw new Error("Unexpected translation result format.");
      }

      if (!translatedPrompt) {
          throw new Error("Failed to extract translated prompt string.")
      }
      
      console.log(`[DEBUG ${emojiId}] Translated prompt: "${translatedPrompt}"`);
    } catch (translateError) {
      console.error(`[DEBUG ${emojiId}] Google Translate Error:`, translateError);
      // Decide how to handle: return error or proceed with original prompt?
      // Let's return an error for now to be explicit.
      const errorMsg = translateError instanceof Error ? translateError.message : "Unknown translation error";
      // Optionally: save the failure to the DB before returning
      // await supabase.from('emoji').insert([{ id: emojiId, prompt: originalPrompt, user_id: user?.id, status: 'failed', error: `Translation Failed: ${errorMsg}` }])
      return NextResponse.json({ error: "Failed to translate prompt", details: errorMsg }, { status: 500 });
    }

    // 2. Fetch User Profile & Check Credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('generation_credits, is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Could not retrieve user profile.", details: profileError.message }, { status: 500 })
    }

    if (!profile) {
       return NextResponse.json({ error: "User profile not found." }, { status: 404 })
    }

    const isAdmin = profile.is_admin;
    const availableCredits = profile.generation_credits;

    if (!isAdmin && availableCredits <= 0) {
      return NextResponse.json({ error: "Insufficient generation credits." }, { status: 402 }); // 402 Payment Required
    }

    // --- Safety Check (simplified for now, Imagen has built-in safety) ---
    const isFlagged = false;
    const safetyRating = 0;

    // --- Prepare initial data (including user_id) ---
    const initialData = { 
      id: emojiId, 
      prompt: originalPrompt, 
      safety_rating: safetyRating,
      user_id: user.id, // Associate with the user
      created_at: new Date().toISOString(), 
      is_flagged: isFlagged,
      is_featured: false, 
      original_url: null, 
      no_background_url: null,
      error: null, 
      status: isFlagged ? 'flagged' : 'pending'
    }

    if (isFlagged) {
      await supabase.from('emoji').insert([initialData])
      return NextResponse.json({ error: "Inappropriate content detected" }, { status: 400 })
    }
    
    // --- Imagen 3 Image Generation using generateImages --- 
    let imageBase64: string | null = null;
    const imagenPrompt = `${translatedPrompt}, emoji style, no background`; // Simplified prompt for Imagen
    try {
      console.log(`[DEBUG ${emojiId}] Sending request to Imagen 3... Model: imagen-3.0-generate-002`);
      console.log(`[DEBUG ${emojiId}] Imagen Prompt (using translated): "${imagenPrompt}"`); // Log the final prompt
      
      // Use generateImages with the specific model and parameters
      const result = await genAI.models.generateImages({
          model: 'imagen-3.0-generate-002', // Specify Imagen 3 model
          prompt: imagenPrompt,
          config: { // Configuration object
              numberOfImages: 1, // Generate 1 image for now
              aspectRatio: "1:1", 
              // Add other parameters from your Python example if needed and supported
              // safetyFilterLevel: 'BLOCK_SOME', // Example, check SDK for exact naming/types
              // personGeneration: 'ALLOW_ADULT', // Example
              // addWatermark: true, // Example
          }
      });

      // Parse the response for generateImages
      if (!result || !result.generatedImages || result.generatedImages.length === 0) {
        console.error("Imagen 3 generateImages Response structure unexpected or empty:", JSON.stringify(result, null, 2));
        throw new Error("Invalid response structure from Imagen 3 generateImages");
      }
      
      const generatedImage = result.generatedImages[0];
      
      // Extract base64 data (assuming it's in image.imageBytes)
      if (!generatedImage?.image?.imageBytes) {
          console.error("Imagen 3 generateImages Response missing imageBytes:", JSON.stringify(generatedImage, null, 2));
          throw new Error("No image data found in Imagen 3 response.");
      }
      
      // CHANGE: Assume imageBytes is *already* a base64 string based on SDK examples/errors
      // imageBase64 = Buffer.from(generatedImage.image.imageBytes).toString('base64'); 
      imageBase64 = generatedImage.image.imageBytes; // Use the value directly
      
      if (!imageBase64 || typeof imageBase64 !== 'string') { // Add type check
         console.error("Imagen 3 response imageBytes is not a valid string:", imageBase64);
         throw new Error("Invalid imageBytes format received from Imagen 3 response.");
      }

      console.log(`[DEBUG ${emojiId}] Imagen 3 Base64 Data Received (length: ${imageBase64.length})`);

    } catch (err) {
      console.error(`[${emojiId}] [User: ${user.id}] Error during Imagen 3 generation:`, err)
      const generationError = err instanceof Error ? err.message : "Unknown Imagen 3 error"
      await supabase.from('emoji').insert([{ ...initialData, error: generationError, status: 'failed' }])
      return NextResponse.json({ error: "Failed to generate image via Imagen 3", details: generationError }, { status: 500 })
    }

    // --- Insert Initial Record (use null for URLs now) & Update DB status to processing_bg ---
    const { error: initialInsertError } = await supabase
      .from('emoji')
      .insert([{ 
        ...initialData, 
        status: 'processing_bg' 
      }])
      .select().single();
    if (initialInsertError && initialInsertError.code !== '23505') {
        return NextResponse.json({ error: "Failed to save initial emoji data.", details: initialInsertError.message }, { status: 500 })
    }

    // --- Replicate Background Removal --- 
    let bgRemovedImageUrl: string | null = null;
    const replicateModelId = "men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7";
    try {
      if (!imageBase64) {
        throw new Error("Assertion failed: imageBase64 is null before Replicate call.");
      }
      const base64DataUri = `data:image/png;base64,${imageBase64}`;
      console.log(`[DEBUG ${emojiId}] Creating Replicate prediction for ${replicateModelId}...`);

      // Start the prediction
      const prediction = await replicate.predictions.create({
        version: replicateModelId.split(':')[1], // Extract version hash
        input: { 
          image: base64DataUri 
        },
        // webhook: "YOUR_WEBHOOK_URL", // Optional: Use webhooks for completion notification
        // webhook_events_filter: ["completed"] 
      });

      console.log(`[DEBUG ${emojiId}] Replicate Prediction ID: ${prediction.id}, Status: ${prediction.status}`);

      if (!prediction || !prediction.id) {
        throw new Error("Failed to create Replicate prediction.");
      }

      // Poll for the result
      let finalPrediction = prediction;
      const maxAttempts = 60; // e.g., 60 attempts * 2 seconds = 120 seconds timeout
      const pollInterval = 2000; // 2 seconds

      for (let i = 0; i < maxAttempts; i++) {
         await new Promise(resolve => setTimeout(resolve, pollInterval));
         finalPrediction = await replicate.predictions.get(prediction.id);
         console.log(`[DEBUG ${emojiId}] Polling Replicate Prediction (${i+1}/${maxAttempts}). Status: ${finalPrediction.status}`);

         if (finalPrediction.status === 'succeeded') {
            console.log(`[DEBUG ${emojiId}] Replicate Prediction Succeeded.`);
            break; // Exit loop on success
         } else if (finalPrediction.status === 'failed' || finalPrediction.status === 'canceled') {
            console.error(`[DEBUG ${emojiId}] Replicate Prediction Failed/Canceled. Error:`, finalPrediction.error);
            throw new Error(`Replicate prediction ${finalPrediction.status}: ${finalPrediction.error || 'Unknown reason'}`);
         }
         // Continue loop if status is starting or processing
      }

      // Check final status after loop
      if (finalPrediction.status !== 'succeeded') {
        throw new Error(`Replicate prediction timed out or did not succeed. Final status: ${finalPrediction.status}`);
      }

      // Extract the output URL
      const output = finalPrediction.output;
      console.log(`[DEBUG ${emojiId}] Replicate Final Output Received:`, output);
      
      if (typeof output === 'string') {
        bgRemovedImageUrl = output;
      } else if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
        bgRemovedImageUrl = output[0];
      } else {
        throw new Error("Unexpected output format from Replicate prediction result.");
      }

      if (!bgRemovedImageUrl) {
         throw new Error("Failed to extract image URL from Replicate prediction result.");
      }
      
      console.log(`[DEBUG ${emojiId}] Replicate Result URL: ${bgRemovedImageUrl}`);
    } catch (err) {
      console.error(`[DEBUG ${emojiId}] Replicate Error:`, err);
      const replicateError = err instanceof Error ? err.message : "Unknown Replicate background removal error"
      await supabase.from('emoji').update({ error: `Replicate BG Removal Failed: ${replicateError}`, status: 'failed' }).eq('id', emojiId)
      const { data: failedData } = await supabase.from('emoji').select().eq('id', emojiId).single();
      // Return failure status
      return NextResponse.json(failedData ?? { ...initialData, error: `Replicate BG Removal Failed: ${replicateError}`, status: 'failed' }, { status: 200 }); 
    }

    // --- Upload to Supabase Storage (Input is now the Replicate URL) ---
    let supabaseStorageUrl: string | null = null;
    try {
      if (!bgRemovedImageUrl) {
        throw new Error("Replicate result URL is missing before Supabase Storage upload.");
      }
      // Fetch the background-removed image from the Replicate URL
      console.log(`[DEBUG ${emojiId}] Fetching image from Replicate URL: ${bgRemovedImageUrl}`);
      const imageResponse = await fetch(bgRemovedImageUrl); 
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from Replicate: ${imageResponse.statusText}`);
      }
      const imageBlob = await imageResponse.blob();
      console.log(`[DEBUG ${emojiId}] Fetched Blob from Replicate result...`);
      const filePath = `public/${user.id}/${emojiId}.png`; 
      console.log(`[DEBUG ${emojiId}] Uploading to Supabase Path...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('emojis-bucket').upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: imageBlob.type || 'image/png'
        });
      if (uploadError) { throw uploadError; }
      const { data: publicUrlData } = supabase.storage.from('emojis-bucket').getPublicUrl(filePath);
      if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error('Failed to get public URL from Supabase Storage.');
      }
      supabaseStorageUrl = publicUrlData.publicUrl;
      console.log(`[DEBUG ${emojiId}] Supabase Storage Public URL: ${supabaseStorageUrl}`);
    } catch (storageError) {
       console.error(`[DEBUG ${emojiId}] Supabase Storage/Fetch Error (Post-Replicate):`, storageError);
       const storageErrorMsg = storageError instanceof Error ? storageError.message : "Unknown Supabase Storage error";
       // Update DB, potentially keep the replicate URL in original_url?
       await supabase.from('emoji').update({ original_url: bgRemovedImageUrl, error: `Storage Failed: ${storageErrorMsg}`, status: 'failed' }).eq('id', emojiId);
       const { data: postReplicateData } = await supabase.from('emoji').select().eq('id', emojiId).single();
       return NextResponse.json(postReplicateData ?? { ...initialData, original_url: bgRemovedImageUrl, error: `Storage Failed: ${storageErrorMsg}`, status: 'generated' }, { status: 200 }); 
    }

    // --- Final Update to DB (Use supabaseStorageUrl for no_background_url) ---
    console.log(`[DEBUG ${emojiId}] Saving to DB no_background_url: ${supabaseStorageUrl}, original_url: ${bgRemovedImageUrl}`); 
    const { data: finalEmojiData, error: finalUpdateError } = await supabase
      .from('emoji')
      .update({ 
          no_background_url: supabaseStorageUrl, // Final URL from Supabase
          original_url: bgRemovedImageUrl, // URL from Replicate (before Supabase upload)
          status: 'generated', 
          error: null 
      })
      .eq('id', emojiId)
      .select().single()
    if (finalUpdateError) {
      // ... error handling, maybe keep original_url ...
      const { data: postReplicateData } = await supabase.from('emoji').select().eq('id', emojiId).single();
      return NextResponse.json(postReplicateData ?? { ...initialData, original_url: bgRemovedImageUrl, no_background_url: supabaseStorageUrl, error: `DB update failed: ${finalUpdateError.message}`, status: 'generated' }, { status: 200 });
    }
    
    // --- Decrement Credits (if not admin and successful so far) ---
    if (!isAdmin) {
        const { error: decrementError } = await supabase.rpc('decrement_credits', { p_user_id: user.id }); 
        
        if (decrementError) {
        }
    }
    
    return NextResponse.json(finalEmojiData)

  } catch (error) {
    console.error(`[${emojiId || 'UNKNOWN'}] Unhandled error in emoji generation:`, error)
    // Add type checking for error
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    if (emojiId && supabase) {
      try {
        await supabase.from('emoji').update({ status: 'failed', error: `Unhandled: ${errorMsg}`.slice(0, 255) }).eq('id', emojiId)
      } catch (dbError) {
        // Error updating DB status, log it but continue
        console.error(`[${emojiId}] Failed to update DB status after unhandled error:`, dbError)
      }
    }
    // Check instanceof ZodError after ensuring z is imported
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error", details: errorMsg }, { status: 500 })
  }
} 
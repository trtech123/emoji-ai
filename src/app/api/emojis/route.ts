import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/server/rate-limit"
import { jwtVerify } from "jose"
import { z } from "zod"
import { nanoid } from "@/lib/utils"
import OpenAI from 'openai'
import { v2 as cloudinary } from 'cloudinary' // Import Cloudinary SDK

// Force Node.js runtime for this route
export const runtime = 'nodejs';

// Log env vars on module load (might not reflect runtime if loaded differently)
console.log("Checking Cloudinary Env Vars on Load:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Exists' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Exists' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Exists' : 'MISSING'
});

// Initialize OpenAI client
if (!process.env.DALLE_API_TOKEN) {
  throw new Error('Missing environment variable: DALLE_API_TOKEN')
}
const openai = new OpenAI({
  apiKey: process.env.DALLE_API_TOKEN,
})

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("Cloudinary credentials missing. Background removal via Cloudinary will be skipped.")
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// No need for JWT check here anymore, Supabase auth handles it
// const jwtSchema = z.object({ ... })

export async function POST(request: Request) {
  console.log("Emoji API route called (DALL-E + Cloudinary BG Removal + Auth)")
  const supabase = createClient() // Use server client
  let emojiId: string | null = null; 

  try {
    // 1. Check User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth Error:', authError)
      return NextResponse.json({ error: "Unauthorized: Please log in to generate emojis." }, { status: 401 })
    }
    console.log(`[User: ${user.id}] Request received.`);

    const body = await request.json()
    const { prompt } = body // Only need prompt from body now

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    emojiId = nanoid()
    const originalPrompt = prompt
    console.log(`[${emojiId}] [User: ${user.id}] Original prompt:`, originalPrompt)

    // 2. Fetch User Profile & Check Credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('generation_credits, is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error(`[${emojiId}] [User: ${user.id}] Error fetching profile:`, profileError)
      return NextResponse.json({ error: "Could not retrieve user profile.", details: profileError.message }, { status: 500 })
    }

    if (!profile) {
       console.error(`[${emojiId}] [User: ${user.id}] Profile not found.`)
       return NextResponse.json({ error: "User profile not found." }, { status: 404 })
    }

    const isAdmin = profile.is_admin;
    const availableCredits = profile.generation_credits;

    console.log(`[${emojiId}] [User: ${user.id}] Generation Credits: ${availableCredits}, IsAdmin: ${isAdmin}`);

    if (!isAdmin && availableCredits <= 0) {
      console.log(`[${emojiId}] [User: ${user.id}] Insufficient credits.`);
      return NextResponse.json({ error: "Insufficient generation credits." }, { status: 402 }); // 402 Payment Required
    }

    // --- OpenAI Moderation Check ---
    console.log("Checking prompt with OpenAI Moderation...")
    const moderationResponse = await openai.moderations.create({ input: originalPrompt })
    console.log("Moderation response:", moderationResponse)
    const moderationResult = moderationResponse.results[0]
    const isFlagged = moderationResult.flagged
    const safetyRating = isFlagged ? 10 : 0
    console.log("Safety rating (0=OK, 10=Flagged):", safetyRating)
    // --- End OpenAI Moderation Check ---

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
      console.log(`[${emojiId}] [User: ${user.id}] Prompt flagged`)
      await supabase.from('emoji').insert([initialData])
      return NextResponse.json({ error: "Inappropriate content detected" }, { status: 400 })
    }
    
    // --- DALL-E Image Generation ---
    console.log(`[${emojiId}] [User: ${user.id}] Starting DALL-E generation...`)
    let dalleImageUrl: string | null = null
    try {
      const dallePrompt = `${originalPrompt}, single emoji, emoji style`
      const imageResponse = await openai.images.generate({
        model: "dall-e-3", prompt: dallePrompt, n: 1,
        size: "1024x1024", response_format: "url",
      })
      dalleImageUrl = imageResponse.data[0]?.url ?? null
      if (!dalleImageUrl) throw new Error("No image URL received from DALL-E")
      console.log(`[${emojiId}] [User: ${user.id}] DALL-E image generated:`, dalleImageUrl)
    } catch (err) {
      console.error(`[${emojiId}] [User: ${user.id}] Error during DALL-E generation:`, err)
      const generationError = err instanceof Error ? err.message : "Unknown DALL-E error"
      // Insert error record associated with user
      await supabase.from('emoji').insert([{ ...initialData, error: generationError, status: 'failed' }])
      return NextResponse.json({ error: "Failed to generate image", details: generationError }, { status: 500 })
    }

    // --- Insert Initial Record & Update DB status to processing_bg ---
    console.log(`[${emojiId}] [User: ${user.id}] Inserting initial record / setting status to processing_bg`) 
    const { error: initialInsertError } = await supabase
      .from('emoji')
      .insert([{ 
        ...initialData, // Includes user_id, prompt, etc.
        original_url: dalleImageUrl, 
        status: 'processing_bg' 
      }])
      .select() // Need select to potentially catch conflict errors
      .single() 

    // Handle insertion errors (excluding duplicate key error 23505, which might happen in retries/edge cases)
    if (initialInsertError && initialInsertError.code !== '23505') {
        console.error(`[${emojiId}] [User: ${user.id}] Error inserting initial record before BG removal:`, initialInsertError);
        // Return error if we couldn't even save the initial state
        return NextResponse.json({ error: "Failed to save initial emoji data.", details: initialInsertError.message }, { status: 500 })
    }

    // --- Cloudinary Background Removal --- 
    let cloudinaryResultUrl: string | null = null
    try {
      if (!dalleImageUrl) {
        throw new Error("Assertion failed: dalleImageUrl is null or undefined before Cloudinary upload.");
      }
      console.log(`[${emojiId}] [User: ${user.id}] Checking process.env.CLOUDINARY_CLOUD_NAME directly:`, process.env.CLOUDINARY_CLOUD_NAME);
      if (!cloudinary.config().cloud_name) {
        throw new Error("Cloudinary is not configured. Skipping background removal.");
      }
      console.log(`[${emojiId}] [User: ${user.id}] Starting Cloudinary upload & background removal for:`, dalleImageUrl)
      const uploadResult = await cloudinary.uploader.upload(dalleImageUrl, {
        public_id: emojiId, folder: "ai-emoji", background_removal: 'cloudinary_ai',
      })
      cloudinaryResultUrl = uploadResult.secure_url
      console.log(`[${emojiId}] [User: ${user.id}] Cloudinary background removal complete. URL:`, cloudinaryResultUrl)
    } catch (err) {
      console.error(`[${emojiId}] [User: ${user.id}] Error during Cloudinary background removal:`, err)
      const bgRemovalError = err instanceof Error ? err.message : "Unknown Cloudinary background removal error"
      await supabase.from('emoji').update({ error: bgRemovalError, status: 'failed' }).eq('id', emojiId)
      const { data: failedData } = await supabase.from('emoji').select().eq('id', emojiId).single();
      return NextResponse.json(failedData ?? { ...initialData, original_url: dalleImageUrl, error: bgRemovalError, status: 'failed' }, { status: 200 }); 
    }

    // --- Final Update to DB with Cloudinary URL and status generated ---
    console.log(`[${emojiId}] [User: ${user.id}] Updating final record with Cloudinary URL and status generated...`)
    const { data: finalEmojiData, error: finalUpdateError } = await supabase
      .from('emoji')
      .update({ no_background_url: cloudinaryResultUrl, status: 'generated', error: null })
      .eq('id', emojiId)
      .select()
      .single()

    if (finalUpdateError) {
      console.error(`[${emojiId}] [User: ${user.id}] Error saving final record:`, finalUpdateError)
      const { data: postBgData } = await supabase.from('emoji').select().eq('id', emojiId).single();
      return NextResponse.json(postBgData ?? { ...initialData, original_url: dalleImageUrl, no_background_url: cloudinaryResultUrl, error: `DB update failed: ${finalUpdateError.message}`, status: 'generated' }, { status: 200 });
    }
    
    // --- Decrement Credits (if not admin and successful so far) ---
    if (!isAdmin) {
        console.log(`[${emojiId}] [User: ${user.id}] Decrementing generation credits.`);
        const { error: decrementError } = await supabase.rpc('decrement_credits', { p_user_id: user.id }); 
        
        if (decrementError) {
            console.error(`[${emojiId}] [User: ${user.id}] Failed to decrement credits via RPC:`, decrementError)
            // Log the error, but don't fail the request.
        }
    }
    
    console.log(`[${emojiId}] [User: ${user.id}] Process complete:`, finalEmojiData)
    return NextResponse.json(finalEmojiData)

  } catch (error) {
    // --- Outer Error Handling --- 
    console.error(`[${emojiId || 'UNKNOWN'}] Unhandled error in emoji generation:`, error)
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    if (emojiId && supabase) {
      try {
        await supabase.from('emoji').update({ status: 'failed', error: `Unhandled: ${errorMsg}`.slice(0, 255) }).eq('id', emojiId)
      } catch (dbError) {
        console.error(`[${emojiId}] Failed to update DB status after unhandled error:`, dbError)
      }
    }
    // Don't check JWT errors here, handled by supabase.auth.getUser()
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error", details: errorMsg }, { status: 500 })
  }
} 
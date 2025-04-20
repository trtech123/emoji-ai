import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { checkRateLimit } from "@/server/rate-limit"
import { jwtVerify } from "jose"
import { z } from "zod"
import { nanoid } from "@/lib/utils"
import OpenAI from 'openai'
import Replicate from "replicate"

// Initialize OpenAI client
if (!process.env.DALLE_API_TOKEN) {
  throw new Error('Missing environment variable: DALLE_API_TOKEN')
}
const openai = new OpenAI({
  apiKey: process.env.DALLE_API_TOKEN,
})

// Re-initialize Replicate client
if (!process.env.REPLICATE_API_TOKEN) {
  console.warn('Warning: Missing environment variable: REPLICATE_API_TOKEN. Background removal will be skipped.')
}
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Ensure this token is in .env
})

// Re-define Replicate model version for background removal
const rembgVersion = "cd8b61b1c413a87250504909356f8790a6c796d4401f13e15e5054d2c8569da0" // Check for latest version if needed

const jwtSchema = z.object({
  ip: z.string(),
  isIOS: z.boolean(),
})

export async function POST(request: Request) {
  console.log("Emoji API route called (DALL-E generation + Replicate BG removal)")
  
  try {
    const body = await request.json()
    console.log("Request body:", body)
    
    const { prompt, token } = body

    if (!prompt) {
      console.error("No prompt provided")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!token) {
      console.error("No token provided")
      return NextResponse.json({ error: "Token is required" }, { status: 401 })
    }

    if (!process.env.API_SECRET) {
      console.error("API_SECRET not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log("Verifying token...")
    // Verify token
    const verified = await jwtVerify(token, new TextEncoder().encode(process.env.API_SECRET))
    const { ip, isIOS } = jwtSchema.parse(verified.payload)
    console.log("Token verified successfully")

    // Check rate limit
    console.log("Checking rate limit...")
    const { remaining } = await checkRateLimit(ip, isIOS)
    if (remaining <= 0) {
      console.error("Rate limit exceeded")
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const id = nanoid()
    const originalPrompt = prompt  // Store the original prompt
    console.log("Original prompt:", originalPrompt)
    
    // --- OpenAI Moderation Check ---
    console.log("Checking prompt with OpenAI Moderation...")
    const moderationResponse = await openai.moderations.create({ input: originalPrompt })
    console.log("Moderation response:", moderationResponse)
    const moderationResult = moderationResponse.results[0]
    const isFlagged = moderationResult.flagged
    // Simple safety rating: 10 if flagged, 0 otherwise (adjust as needed)
    const safetyRating = isFlagged ? 10 : 0
    console.log("Safety rating (0=OK, 10=Flagged):", safetyRating)
    // --- End OpenAI Moderation Check ---

    const data = { 
      id, 
      prompt: originalPrompt,  // Use the original prompt
      safety_rating: safetyRating,
      created_at: new Date().toISOString(),
      is_flagged: isFlagged,
      is_featured: false,
      original_url: null,
      no_background_url: null,
      error: null,
      status: 'pending' // Initial status
    }

    // Create admin client
    const supabaseAdmin = createAdminClient()

    if (isFlagged) {
      console.log("Prompt flagged as inappropriate by OpenAI")
      await supabaseAdmin.from('emoji').insert([{ ...data, is_flagged: true, status: 'flagged' }])
      return NextResponse.json({ error: "Inappropriate content detected" }, { status: 400 })
    }

    // Create initial emoji record (without image URL yet)
    console.log("Creating initial emoji record (pre-generation):", data)
    const { data: initialEmojiData, error: insertError } = await supabaseAdmin
      .from('emoji')
      .insert([data])
      .select()
      .single()
    
    if (insertError) {
      console.error("Error inserting initial emoji record:", {
        message: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint,
      })
      return NextResponse.json({ error: "Failed to create emoji record", details: insertError.message }, { status: 500 })
    }

    if (!initialEmojiData) {
      console.error("No initial emoji data returned after insert")
      return NextResponse.json({ error: "Failed to create emoji record", details: "No data returned from database" }, { status: 500 })
    }

    console.log("Initial emoji record created successfully:", initialEmojiData)

    // --- DALL-E Image Generation ---
    console.log("Starting DALL-E generation with prompt:", originalPrompt)
    let imageUrl: string | null = null
    let generationError: string | null = null
    try {
      // --- Update DALL-E Prompt for Sticker Style (no transparent bg) --- 
      const dallePrompt = `${originalPrompt}, single emoji, sticker style, svg vector art`
      console.log("Using DALL-E prompt:", dallePrompt)
      // ---------------------------------------------------------------

      const imageResponse = await openai.images.generate({
        model: "dall-e-3", 
        prompt: dallePrompt, // Use the modified prompt
        n: 1,
        size: "1024x1024", 
        response_format: "url", 
      })
      console.log("DALL-E response:", imageResponse)
      imageUrl = imageResponse.data[0]?.url ?? null // Get the URL

      if (!imageUrl) {
         throw new Error("No image URL received from DALL-E")
      }
      console.log("DALL-E image generated successfully:", imageUrl)

    } catch (err) {
      console.error("Error during DALL-E generation:", err)
      generationError = err instanceof Error ? err.message : "Unknown DALL-E error"
      // Insert record with error if generation fails
      await supabaseAdmin.from('emoji').insert([{ ...data, error: generationError, status: 'failed' }]) // Add status
      return NextResponse.json({ error: "Failed to generate image", details: generationError }, { status: 500 })
    }
    // --- End DALL-E Image Generation ---

    // --- Create/Update Emoji Record (with DALL-E URL, before background removal) ---
    console.log("Upserting emoji record with DALL-E URL (status: processing_bg)...")
    const { data: updatedEmojiData, error: upsertError } = await supabaseAdmin
      .from('emoji')
      // Update data before upsert: add DALL-E URL and set status
      .upsert({ ...data, original_url: imageUrl, status: 'processing_bg' }) 
      .select()
      .single()

    if (upsertError) {
      console.error("Error upserting emoji record with DALL-E URL:", {
        message: upsertError.message, code: upsertError.code, details: upsertError.details, hint: upsertError.hint,
      })
       // If we can't save the result, return an error
      return NextResponse.json({ error: "Failed to save initial generation result", details: upsertError.message }, { status: 500 })
    }
    console.log("Emoji record upserted with DALL-E URL:", updatedEmojiData)
    // --- End Create/Update ---

    // --- Trigger Replicate Background Removal (Asynchronous) ---
    if (process.env.REPLICATE_API_TOKEN && imageUrl) {
      try {
        console.log("Triggering Replicate background removal for:", imageUrl)
        // Construct the webhook URL (ensure NGROK_URL or VERCEL_URL and WEBHOOK_SECRET are set)
        const webhookUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}/api/webhook/replicate`
          : process.env.NGROK_URL 
          ? `${process.env.NGROK_URL}/api/webhook/replicate`
          : null

        if (!webhookUrl) {
          console.warn("Webhook URL not configured (VERCEL_URL or NGROK_URL). Cannot trigger background removal callback.")
          // Update status to indicate BG removal failed
          await supabaseAdmin.from('emoji').update({ status: 'failed', error: 'Webhook URL not configured' }).eq('id', id)
        } else if (!process.env.WEBHOOK_SECRET) {
           console.warn("WEBHOOK_SECRET not set. Cannot secure Replicate webhook.")
            // Update status to indicate BG removal failed
          await supabaseAdmin.from('emoji').update({ status: 'failed', error: 'Webhook secret not configured' }).eq('id', id)
        } else {
            const prediction = await replicate.predictions.create({
              version: rembgVersion,
              input: { image: imageUrl }, // Pass DALL-E image URL
              webhook: `${webhookUrl}?id=${id}&secret=${process.env.WEBHOOK_SECRET}`, 
              webhook_events_filter: ["completed"],
            })
            console.log("Replicate background removal prediction started:", prediction.id)
            // Status is already 'processing_bg'
        }
      } catch (err) {
        console.error("Error triggering Replicate background removal:", err)
        const bgErrorMsg = err instanceof Error ? err.message : "BG removal trigger failed"
        // Update status and error in DB
        await supabaseAdmin.from('emoji').update({ error: bgErrorMsg, status: 'failed' }).eq('id', id)
      }
    } else {
      console.log("Skipping Replicate background removal (missing REPLICATE_API_TOKEN or DALL-E image URL).")
      // Update status to indicate BG removal was skipped/failed
       await supabaseAdmin.from('emoji').update({ status: 'failed', error: 'BG removal skipped (config/image missing)' }).eq('id', id)
    }
    // --- End Background Removal Trigger ---

    // Return the data including the DALL-E generated URL
    // The no_background_url will be updated later by the webhook
    return NextResponse.json(updatedEmojiData) // Return the record as it is now (with DALL-E URL)

  } catch (error) {
    console.error("Unhandled error in emoji generation:", error)
    if (error instanceof Error) {
      console.error("Error details:", { name: error.name, message: error.message, stack: error.stack })
       // Check for specific JOSE errors if the error object has a 'code' property
       if ('code' in error && (error.code === 'ERR_JWT_INVALID' || error.code === 'ERR_JWS_INVALID')) {
          return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
       }
    }
    // Check for Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 })
    }
    // General internal server error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
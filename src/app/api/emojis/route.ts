import { NextResponse } from "next/server"
import { replicate } from "@/server/replicate"
import { createAdminClient } from "@/lib/supabase"
import { checkRateLimit } from "@/server/rate-limit"
import { jwtVerify } from "jose"
import { z } from "zod"
import { nanoid } from "@/lib/utils"

const jwtSchema = z.object({
  ip: z.string(),
  isIOS: z.boolean(),
})

export async function POST(request: Request) {
  console.log("Emoji API route called")
  
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
    console.log("Classifying prompt...")
    const originalPrompt = prompt  // Store the original prompt
    console.log("Original prompt:", originalPrompt)
    
    const safetyRating = await replicate.classifyPrompt({ prompt })
    console.log("Safety rating:", safetyRating)

    const data = { 
      id, 
      prompt: originalPrompt,  // Use the original prompt
      safety_rating: safetyRating,
      created_at: new Date().toISOString(),
      is_flagged: false,
      is_featured: false,
      original_url: null,
      no_background_url: null,
      error: null
    }

    // Create admin client
    const supabaseAdmin = createAdminClient()

    if (safetyRating >= 9) {
      console.log("Prompt flagged as inappropriate")
      await supabaseAdmin.from('emoji').insert([{ ...data, is_flagged: true }])
      return NextResponse.json({ error: "Inappropriate content" }, { status: 400 })
    }

    // Create initial emoji record
    console.log("Creating emoji record with data:", data)
    const { data: emojiData, error: insertError } = await supabaseAdmin
      .from('emoji')
      .insert([data])
      .select()
      .single()
    
    if (insertError) {
      console.error("Error inserting emoji:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      return NextResponse.json({ 
        error: "Failed to create emoji record",
        details: insertError.message 
      }, { status: 500 })
    }

    if (!emojiData) {
      console.error("No emoji data returned after insert")
      return NextResponse.json({ 
        error: "Failed to create emoji record",
        details: "No data returned from database" 
      }, { status: 500 })
    }

    console.log("Emoji record created successfully:", emojiData)
    
    // Generate emoji with the original prompt
    console.log("Starting emoji generation with original prompt:", originalPrompt)
    await replicate.createEmoji(originalPrompt, id)
    
    console.log("Emoji generation started successfully")
    return NextResponse.json(emojiData)
  } catch (error) {
    console.error("Error in emoji generation:", error)
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
"use server"

import { nanoid } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { replicate } from "@/server/replicate"
import { checkRateLimit } from "@/server/rate-limit"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { z } from "zod"

const jwtSchema = z.object({
  ip: z.string(),
  isIOS: z.boolean(),
})

interface FormState {
  message: string
}

export async function createEmoji(prevFormState: FormState | undefined, formData: FormData): Promise<FormState | void> {
  const prompt = (formData.get("prompt") as string | null)?.trim().replaceAll(":", "")
  const token = formData.get("token") as string | null

  if (!prompt) return // no need to display an error message for blank prompts
  const id = nanoid()

  try {
    if (!token) {
      console.error("No token provided")
      return { message: "Authentication error, please refresh the page." }
    }

    if (!process.env.API_SECRET) {
      console.error("API_SECRET is not set")
      return { message: "Server configuration error, please try again later." }
    }

    const verified = await jwtVerify(token, new TextEncoder().encode(process.env.API_SECRET))
    const { ip, isIOS } = jwtSchema.parse(verified.payload)

    const { remaining } = await checkRateLimit(ip, isIOS)
    if (remaining <= 0) return { message: "Free limit reached, download mobile app for unlimited access." }

    const safetyRating = await replicate.classifyPrompt({ prompt })
    const data = { id, prompt, safetyRating }

    if (safetyRating >= 9) {
      await supabase.from('emoji').insert([{ ...data, isFlagged: true }])
      return { message: "Nice try! Your prompt is inappropriate, let's keep it PG." }
    }

    await Promise.all([
      supabase.from('emoji').insert([data]),
      replicate.createEmoji(data)
    ])
  } catch (error) {
    console.error("Error in createEmoji:", error)
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return { message: "Connection error, please refresh the page." }
  }

  redirect(`/p/${id}`)
}

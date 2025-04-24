import Replicate from "replicate"
import "server-only"
import { EMOJI_SIZE, SITE_URL } from "../lib/constants"
import { createAdminClient } from "@/lib/supabase"

export class ReplicateClient {
  private client: Replicate

  constructor() {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Missing environment variable: REPLICATE_API_TOKEN')
    }

    this.client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  }

  async createEmoji(prompt: string, emojiId: string) {
    console.log('=== Starting emoji generation process ===')
    console.log('Emoji ID:', emojiId)
    console.log('Original prompt:', prompt)

    try {
      // Step 1: Generate emoji with SDXL
      console.log('Step 1: Creating Replicate prediction...')
      const sdxlPrompt = `A TOK emoji of a ${prompt}`
      console.log('SDXL prompt:', sdxlPrompt)
      
      const output = await this.client.run(
        "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
        {
          input: {
            prompt: sdxlPrompt,
            apply_watermark: false
          }
        }
      ) as string[]

      console.log('SDXL output:', output)

      if (!output || !output[0]) {
        throw new Error('No output received from Replicate SDXL')
      }

      // Step 2: Update DB with original URL
      console.log('Step 2: Updating emoji record with original URL...')
      const supabaseAdmin = createAdminClient()
      const { error: updateError } = await supabaseAdmin
        .from('emoji')
        .update({ 
          original_url: output[0],
          status: 'generated'
        })
        .eq('id', emojiId)

      if (updateError) {
        console.error('Error updating emoji record with original URL:', updateError)
        throw updateError
      }

      console.log('Successfully updated emoji record with original URL')

      // Step 3: Remove background
      console.log('Step 3: Removing background from emoji...')
      const { data: removeBgData, error: removeBgError } = await this.removeBackground({
        id: emojiId,
        image: output[0]
      })

      if (removeBgError) {
        console.error('Error removing background:', removeBgError)
        throw removeBgError
      }

      console.log('Background removal completed successfully')
      console.log('=== Emoji generation process completed ===')
      return { data: { output, removeBgData }, error: null }
    } catch (error) {
      console.error('Error in createEmoji:', error)
      // Update DB with error status
      try {
        const supabaseAdmin = createAdminClient()
        await supabaseAdmin
          .from('emoji')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', emojiId)
      } catch (dbError) {
        console.error('Error updating error status:', dbError)
      }
      return { data: null, error }
    }
  }

  async removeBackground({ id, image }: { id: string; image: string }) {
    console.log('=== Starting background removal ===')
    console.log('Emoji ID:', id)
    console.log('Image URL:', image)

    try {
      const output = await this.client.run(
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        {
          input: {
            image_url: image
          }
        }
      ) as unknown as string

      console.log('Background removal output:', output)

      if (!output) {
        throw new Error('No output received from Replicate background removal')
      }

      // Update DB with no_background URL
      console.log('Updating emoji record with no_background URL...')
      const supabaseAdmin = createAdminClient()
      const { error: updateError } = await supabaseAdmin
        .from('emoji')
        .update({ 
          no_background_url: output,
          status: 'generated'
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating emoji record with no_background URL:', updateError)
        throw updateError
      }

      console.log('Successfully updated emoji record with no_background URL')
      console.log('=== Background removal completed ===')
      return { data: { output }, error: null }
    } catch (error) {
      console.error('Error in removeBackground:', error)
      // Update DB with error status
      try {
        const supabaseAdmin = createAdminClient()
        await supabaseAdmin
          .from('emoji')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', id)
      } catch (dbError) {
        console.error('Error updating error status:', dbError)
      }
      return { data: null, error }
    }
  }

  async classifyPrompt({ prompt: _prompt }: { prompt: string }): Promise<number> {
    console.log('Classifying prompt:', _prompt)
    const output = await this.client.run(
      "fofr/prompt-classifier:1ffac777bf2c1f5a4a5073faf389fefe59a8b9326b3ca329e9d576cce658a00f",
      {
        input: {
          prompt: _prompt,
          max_new_tokens: 128,
          temperature: 0.2,
          top_p: 0.9,
          top_k: 50,
          stop_sequences: "[/SAFETY_RANKING]",
        },
      }
    )

    const safetyRating = Number((output as string[] | undefined)?.join("").trim())
    console.log('Classification result:', safetyRating)
    return safetyRating || 0
  }

  async getPredictionStatus(predictionId: string) {
    return this.client.predictions.get(predictionId)
  }
}

export const replicate = new ReplicateClient()

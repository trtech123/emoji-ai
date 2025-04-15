import { NextResponse } from "next/server"
import { replicate } from "@/server/replicate"
import { createAdminClient } from "@/lib/supabase"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
    }

    // Get prediction status from Replicate
    const prediction = await replicate.getPredictionStatus(id)
    
    if (!prediction) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 })
    }

    // If prediction is completed, update the emoji record
    if (prediction.status === "succeeded" && prediction.output?.[0]) {
      const supabaseAdmin = createAdminClient()
      const { error: updateError } = await supabaseAdmin
        .from('emoji')
        .update({
          original_url: prediction.output[0],
          status: 'generated'
        })
        .eq('replicate_id', id)

      if (updateError) {
        console.error('Error updating emoji record:', updateError)
        return NextResponse.json({ error: "Failed to update emoji record" }, { status: 500 })
      }
    }

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error getting prediction status:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
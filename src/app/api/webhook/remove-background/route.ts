import { NextResponse } from "next/server"
import { supabase } from "@/server/db"

export async function POST(request: Request) {
  try {
    const { id, url, error: bgError } = await request.json()

    if (bgError) {
      const { error } = await supabase
        .from('emoji')
        .update({ is_flagged: true, error: bgError })
        .eq('id', id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase
      .from('emoji')
      .update({ original_url: url, status: 'completed' })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing background removal:", error)
    return NextResponse.json({ error: "Failed to process background removal" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { supabase } from "@/server/db"

export async function POST(request: Request) {
  try {
    const { id, url } = await request.json()

    const { error } = await supabase
      .from('emojis')
      .update({ no_background_url: url })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving emoji:", error)
    return NextResponse.json({ error: "Failed to save emoji" }, { status: 500 })
  }
}

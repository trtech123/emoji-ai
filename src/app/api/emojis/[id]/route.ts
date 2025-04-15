import { NextResponse } from "next/server"
import { supabase } from "@/server/db"

export const runtime = "edge"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: emoji, error } = await supabase
      .from('emojis')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!emoji) return NextResponse.json({ error: "Emoji not found" }, { status: 404 })

    return NextResponse.json(emoji)
  } catch (error) {
    console.error("Error fetching emoji:", error)
    return NextResponse.json({ error: "Failed to fetch emoji" }, { status: 500 })
  }
}

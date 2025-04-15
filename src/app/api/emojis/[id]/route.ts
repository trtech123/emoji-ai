import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("emoji")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching emoji:", error)
      return NextResponse.json({ error: "Failed to fetch emoji" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Emoji not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/emojis/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const fetchCache = "force-no-store"
export const revalidate = 0

type Props = {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { data: emoji, error } = await supabase
      .from('emoji')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!emoji) {
      return NextResponse.json({ error: "Emoji not found" }, { status: 404 })
    }

    return NextResponse.json({ emoji })
  } catch (error) {
    console.error("Error in GET /api/emojis/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

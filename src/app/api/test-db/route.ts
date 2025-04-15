import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if lowercase emoji table exists
    const { data: emojiData, error: emojiError } = await supabaseAdmin
      .from('emoji')
      .select('count')
      .limit(1)

    // Check if uppercase Emoji table exists
    const { data: EmojiData, error: EmojiError } = await supabaseAdmin
      .from('Emoji')
      .select('count')
      .limit(1)

    if (emojiError && EmojiError) {
      console.error('Error testing database connection:', emojiError)
      return NextResponse.json({ 
        status: 'error',
        message: 'Neither emoji nor Emoji table exists',
        error: emojiError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful',
      tables: {
        emoji: {
          exists: !emojiError,
          count: emojiData?.[0]?.count
        },
        Emoji: {
          exists: !EmojiError,
          count: EmojiData?.[0]?.count
        }
      }
    })
  } catch (error) {
    console.error('Error in test-db route:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 

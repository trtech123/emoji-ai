import { createAdminClient } from "@/lib/supabase"
import { Suspense } from "react"
import { supabase } from "@/lib/supabase"

interface CountDisplayProps {
  count?: number
}

function CountDisplay({ count }: CountDisplayProps) {
  return (
    <span className="text-sm text-gray-400">
      {count?.toLocaleString() ?? "—"} emojis generated
    </span>
  )
}

async function getEmojisCount() {
  try {
    const supabaseAdmin = createAdminClient()
    const { count, error } = await supabaseAdmin
      .from('emoji')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting emojis:', error)
      return 0
    }

    return count ?? 0
  } catch (error) {
    console.error('Error in getEmojisCount:', error)
    return 0
  }
}

async function getEmojiCount() {
  try {
    const { count, error } = await supabase
      .from('emoji')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching emoji count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getEmojiCount:', error)
    return 0
  }
}

export async function EmojiCount() {
  const count = await getEmojiCount()

  return (
    <p className="text-gray-500 text-sm mb-8">
      {count.toLocaleString()} אימוג׳ים נוצרו
    </p>
  )
}

export function EmojiCountSuspense() {
  return (
    <Suspense fallback={<CountDisplay />}>
      <EmojiCount />
    </Suspense>
  )
}

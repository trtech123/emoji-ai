import { supabase } from "@/lib/supabase"
import { Suspense } from "react"

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
    const { count, error } = await supabase
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

export async function EmojiCount() {
  const count = await getEmojisCount()
  return <CountDisplay count={count} />
}

export function EmojiCountSuspense() {
  return (
    <Suspense fallback={<CountDisplay />}>
      <EmojiCount />
    </Suspense>
  )
}

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
  const { count } = await supabase
    .from('emoji')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
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

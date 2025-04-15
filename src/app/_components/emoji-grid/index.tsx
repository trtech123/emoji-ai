import { supabase } from "@/lib/supabase"
import { EmojiCard } from "../emoji-card"

interface EmojiGridProps {
  prompt?: string
}

async function getEmojis(prompt?: string) {
  let query = supabase
    .from('emoji')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(50)

  if (prompt) {
    query = query.ilike('prompt', `%${prompt}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching emojis:', error)
    return []
  }

  return data
}

export async function EmojiGrid({ prompt }: EmojiGridProps) {
  const emojis = await getEmojis(prompt)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {emojis.map((emoji) => (
        <EmojiCard key={emoji.id} id={emoji.id} alwaysShowDownloadBtn />
      ))}
    </div>
  )
}

import { supabase } from "@/lib/supabase"
import { EmojiCard } from "../emoji-card"

interface EmojiGridProps {
  prompt?: string
}

async function getEmojis(prompt?: string) {
  try {
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

    return data || []
  } catch (error) {
    console.error('Error in getEmojis:', error)
    return []
  }
}

export async function EmojiGrid({ prompt }: EmojiGridProps) {
  const emojis = await getEmojis(prompt)

  if (emojis.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No emojis found. Be the first to create one!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {emojis.map((emoji) => (
        <EmojiCard key={emoji.id} id={emoji.id} alwaysShowDownloadBtn />
      ))}
    </div>
  )
}

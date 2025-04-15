import { supabase } from "@/lib/supabase"
import { ButtonCard } from "./button-card"

interface EmojiCardProps {
  id: string
  alwaysShowDownloadBtn?: boolean
}

async function getEmoji(id: string) {
  try {
    const { data, error } = await supabase
      .from('emoji')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching emoji:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getEmoji:', error)
    return null
  }
}

export async function EmojiCard({ id, alwaysShowDownloadBtn }: EmojiCardProps) {
  const emoji = await getEmoji(id)

  if (!emoji) {
    return null
  }

  return (
    <ButtonCard
      id={emoji.id}
      prompt={emoji.prompt}
      imageUrl={emoji.imageUrl}
      createdAt={emoji.created_at}
      alwaysShowDownloadBtn={alwaysShowDownloadBtn}
    />
  )
}

import "server-only"
import { supabase } from "./db"

export const getEmojisCount = async () => {
  const { count, error } = await supabase
    .from('emojis')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count || 0
}

import "server-only"
import { supabase } from "./db"

export const getEmoji = async (id: string) => {
  const { data, error } = await supabase
    .from('emoji')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

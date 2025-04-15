import { supabase } from "./db"

interface GetEmojisOptions {
  limit?: number
  offset?: number
  orderBy?: { column: string; ascending: boolean }
}

export const getEmojis = async (opts: GetEmojisOptions = {}) => {
  const { limit = 20, offset = 0, orderBy = { column: 'created_at', ascending: false } } = opts

  const { data, error } = await supabase
    .from('emoji')
    .select('*')
    .order(orderBy.column, { ascending: orderBy.ascending })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

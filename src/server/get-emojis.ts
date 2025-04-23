import { supabase } from "./db"

interface GetEmojisOptions {
  limit?: number
  offset?: number
  orderBy?: { column: string; ascending: boolean }
  status?: string;
  searchQuery?: string;
}

export const getEmojis = async (opts: GetEmojisOptions = {}) => {
  const { limit = 50, offset = 0, orderBy = { column: 'created_at', ascending: false }, status, searchQuery } = opts

  let query = supabase
    .from('emoji')
    .select('*')
    .order(orderBy.column, { ascending: orderBy.ascending })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('prompt', `%${searchQuery.trim()}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

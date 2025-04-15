import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://db.rhyecivcfzfpuzxdyxur.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey) 
import { supabase, supabaseAdmin } from "./supabase"

export async function checkEmojiTable() {
  try {
    const { data, error } = await supabaseAdmin
      .from('emoji')
      .select('count')
      .limit(1)

    if (error) {
      if (error.code === '42P01') { // Table does not exist
        console.log('Emoji table does not exist')
        return false
      }
      console.error('Error checking emoji table:', error)
      return false
    }

    console.log('Emoji table exists')
    return true
  } catch (error) {
    console.error('Error in checkEmojiTable:', error)
    return false
  }
}

export async function createEmojiTable() {
  try {
    const { error } = await supabaseAdmin
      .from('emoji')
      .select('count')
      .limit(1)
    
    if (error && error.code === '42P01') { // Table does not exist
      console.error('Emoji table does not exist. Please create it using the Supabase dashboard or SQL editor with the following schema:')
      console.error(`
        CREATE TABLE emoji (
          id TEXT PRIMARY KEY,
          prompt TEXT NOT NULL,
          safety_rating INTEGER NOT NULL,
          original_url TEXT NOT NULL,
          no_background_url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
      return false
    }

    return true // Table already exists
  } catch (error) {
    console.error('Error in createEmojiTable:', error)
    return false
  }
}

export async function testEmojiTable() {
  try {
    // Try to insert a test record
    const testEmoji = {
      id: 'test-' + Date.now(),
      prompt: 'test emoji',
      safety_rating: 0,
      original_url: 'https://example.com/test.png',
      no_background_url: 'https://example.com/test-nobg.png'
    }

    const { data, error } = await supabaseAdmin
      .from('emoji')
      .insert([testEmoji])
      .select()

    if (error) {
      console.error('Error testing emoji table:', error)
      return false
    }

    console.log('Successfully inserted test emoji:', data)
    
    // Clean up the test record
    await supabaseAdmin
      .from('emoji')
      .delete()
      .eq('id', testEmoji.id)

    return true
  } catch (error) {
    console.error('Error in testEmojiTable:', error)
    return false
  }
} 
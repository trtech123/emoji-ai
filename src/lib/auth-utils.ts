"use client"

import { createClient } from '@/lib/supabase/client'
import { SITE_URL } from '@/lib/constants'

export async function signInWithGoogle() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
  
  return { success: true }
} 
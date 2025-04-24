import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Force production URL in callback
  const baseUrl = 'https://emoji-ai-delta.vercel.app'
  
  console.log('[Auth Callback] Debug:', {
    requestUrl: request.url,
    code: code ? 'exists' : 'missing',
    next,
    SITE_URL,
    baseUrl,
    finalRedirectUrl: `${baseUrl}${next}`
  });

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = `${baseUrl}${next}`
      console.log('[Auth Callback] Success - Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl)
    }
  }

  console.error('[Auth Callback] Error exchanging code for session')
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
} 
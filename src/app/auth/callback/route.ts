import { createClient } from '@/lib/supabase/server' // Use server client here
import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'
  
  console.log('[Auth Callback] Request URL:', request.url);
  console.log('[Auth Callback] Origin:', origin);
  console.log('[Auth Callback] SITE_URL:', SITE_URL);
  
  // Always use SITE_URL instead of origin
  const baseUrl = SITE_URL;

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = `${baseUrl}${next}`
      console.log('[Auth Callback] Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  console.error('[Auth Callback] Error exchanging code for session')
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
} 
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // const next = searchParams.get('next') ?? '/' // We will ignore this
  
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Always redirect to the site root (home page) after successful login
      return NextResponse.redirect(`${SITE_URL}/`)
    }
  }

  // Redirect to an error page if code exchange fails or code is missing
  console.error("Redirecting to auth error page.");
  return NextResponse.redirect(`${SITE_URL}/auth/auth-code-error`)
} 
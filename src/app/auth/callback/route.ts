import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = `${SITE_URL}${next}`
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(`${SITE_URL}/auth/auth-code-error`)
} 
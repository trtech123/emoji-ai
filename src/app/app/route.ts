import { NextResponse } from 'next/server'
import { APP_STORE_URL } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const referrer = searchParams.get('referrer') ?? 'website'
  
  return NextResponse.redirect(APP_STORE_URL)
} 
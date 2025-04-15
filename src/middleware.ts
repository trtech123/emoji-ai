import { track } from "@vercel/analytics/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { APP_STORE_URL } from "./lib/constants"

export async function middleware(request: NextRequest) {
  // Skip middleware for test endpoint
  if (request.nextUrl.pathname.startsWith('/api/test-db')) {
    return NextResponse.next()
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Track analytics for app store redirects
  if (request.nextUrl.pathname === '/app') {
    await track("Go to App Store", {
      origin: request.nextUrl.origin,
      referrer: request.nextUrl.searchParams.get("referrer") ?? "unknown",
    })
    return NextResponse.redirect(APP_STORE_URL)
  }

  // Add CORS headers to all other responses
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}

export const config = {
  matcher: ["/app", "/api/test-db", "/:path*"],
}

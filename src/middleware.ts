import { track } from "@vercel/analytics/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { APP_STORE_URL } from "./lib/constants"

export async function middleware(request: NextRequest) {
  // Skip middleware for test endpoint
  if (request.nextUrl.pathname.startsWith('/api/test-db')) {
    return NextResponse.next()
  }

  await track("Go to App Store", {
    origin: request.nextUrl.origin,
    referrer: request.nextUrl.searchParams.get("referrer") ?? "unknown",
  })
  return NextResponse.redirect(APP_STORE_URL)
}

export const config = {
  matcher: ["/app", "/api/test-db"],
}

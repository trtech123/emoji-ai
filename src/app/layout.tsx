'use client';

import { APP_STORE_URL, PROD_URL } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./_components/providers"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthButton } from './_components/auth-button'
import RightSidebar from "./_components/right-sidebar"
import { SearchBar } from "./_components/search-bar"
import { BODY_PADDING } from "@/lib/constants"
import { MobileInputFix } from "./_components/mobile-input-fix"
import { MobileBottomNav } from "./_components/mobile-bottom-nav"
import { HeaderWithSearch } from "./_components/header-with-search"

/**
 * Opt out of caching for all data requests in the route segment. Based on the docs,
 * we should be **dynamically rendering** the page with **cached data**.
 *
 * With default config, the root page (/) is statically rendered and dynamic pages
 * (/p/[id]) are dynamically rendered. This means that the root page will be cached
 * and quickly start serving stale data, while the dynamic pages will be revalidated.
 *
 * From the docs:
 *
 * > If the segment is static (default), the output of the request will be cached and revalidated as part of the route segment.
 * > If the segment is dynamic, the output of the request will not be cached and will be re-fetched on every request when the segment is rendered.
 *
 * Kinda cool, but a bit too much magic for me.
 *
 * @see https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering
 */
export const dynamic = "force-dynamic"
export const runtime = "edge"

const inter = Inter({ subsets: ["latin"] })

export function generateMetadata(): Metadata {
  const title = "AI Emoji Generator"
  const description = "הפוך את הרעיונות שלך לאימוג&apos;ים תוך שניות. צור את אימוג&apos;י ה-Slack האהובים עליך בלחיצה אחת."

  return {
    metadataBase: new URL(PROD_URL),
    title,
    description,
    applicationName: "AI Emojis",
    other: {
      "apple-itunes-app": "app-id=6468916301",
    },
    openGraph: {
      title,
      description,
      url: PROD_URL,
      siteName: "emojis.sh",
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@pondorasti",
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className={cn("antialiased font-sans scroll-smooth", inter.className)}>
        <MobileInputFix />
        <div className="flex flex-row min-h-screen">
          <div className="hidden md:block">
            <RightSidebar />
          </div>
          <div className="flex flex-col flex-grow">
            <HeaderWithSearch />
            <main className={cn("flex-grow flex items-stretch flex-col pb-16 md:pb-0", BODY_PADDING)}>
              <Providers>{children}</Providers>
            </main>
          </div>
        </div>
        <MobileBottomNav />
        <Toaster position="bottom-left" />
      </body>
    </html>
  )
}

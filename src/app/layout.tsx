import { APP_STORE_URL, PROD_URL } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Github } from "lucide-react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { Providers } from "./_components/providers"
import "./globals.css"

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

const BODY_PADDING = "px-4 sm:px-6"

const inter = Inter({ subsets: ["latin"] })

export function generateMetadata(): Metadata {
  const title = "AI Emoji Generator"
  const description = "Turn your ideas into emojis in seconds. Generate your favorite Slack emojis with just one click."

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
      locale: "en_US",
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
    <html lang="en">
      <body className={cn(inter.className, "antialiased bg-gray-100")}>
        <header
          className={cn(
            "top-0 sticky z-20 w-full py-3 bg-gray-100 flex flex-row flex-nowrap justify-between max-w-5xl mx-auto h-14 items-stretch animate-in fade-in slide-in-from-top-4 duration-1000 ease-in-out",
            BODY_PADDING
          )}
        >
          <div></div>
          <div></div>
        </header>
        <main className={cn("min-h-screen flex items-stretch flex-col pb-28 max-w-5xl mx-auto", BODY_PADDING)}>
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}

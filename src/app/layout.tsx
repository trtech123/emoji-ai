import { PROD_URL } from "@/lib/constants"
import type { Metadata } from "next"

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

import { ClientLayout } from "./_components/client-layout"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>
}

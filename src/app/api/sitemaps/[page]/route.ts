import { PROD_URL, SITEMAP_PAGE_SIZE } from "@/lib/constants"
import { supabase } from "@/server/db"

export async function GET(
  request: Request,
  { params }: { params: { page: string } }
) {
  const page = parseInt(params.page)
  const offset = (page - 1) * SITEMAP_PAGE_SIZE

  const { data: emojis } = await supabase
    .from('emojis')
    .select('id, updated_at')
    .order('created_at', { ascending: true })
    .range(offset, offset + SITEMAP_PAGE_SIZE - 1)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${emojis
        ?.map(
          (emoji) => `
        <url>
          <loc>${PROD_URL}/emojis/${emoji.id}</loc>
          <lastmod>${new Date(emoji.updated_at).toISOString()}</lastmod>
        </url>
      `
        )
        .join("")}
    </urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}

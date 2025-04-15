import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ButtonCard } from "@/app/_components/emoji-card/button-card"
import { Metadata, ResolvingMetadata } from "next"
import { PageContent } from "@/app/_components/page-content"

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params?.id
  if (!id) return {}

  const { data: emoji, error } = await supabase
    .from('emoji')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !emoji) return {}

  const title = `${emoji.prompt} | AI Emoji Generator`
  const description = `An emoji generated from the prompt: ${emoji.prompt}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: emoji.no_background_url ? [emoji.no_background_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: emoji.no_background_url ? [emoji.no_background_url] : undefined,
      creator: "@pondorasti",
    },
  }
}

export default async function Page({ params }: PageProps) {
  const id = params?.id
  if (!id) {
    notFound()
  }

  const { data: emoji, error } = await supabase
    .from('emoji')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !emoji) {
    notFound()
  }

  return (
    <PageContent>
      <div className="flex flex-col items-center gap-8">
        <div className="w-full max-w-2xl">
          <ButtonCard
            id={emoji.id}
            prompt={emoji.prompt}
            imageUrl={emoji.no_background_url || emoji.original_url}
            createdAt={emoji.created_at}
            alwaysShowDownloadBtn
          />
        </div>
      </div>
    </PageContent>
  )
}

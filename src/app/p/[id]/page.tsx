import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Metadata, ResolvingMetadata } from "next"
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, MoreHorizontal, Share, Download, Copy, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ActionButtons } from './action-buttons';
import { he } from 'date-fns/locale';

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

  const supabase = createClient()
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

interface EmojiData {
  id: string;
  prompt: string;
  safety_rating: number;
  original_url: string | null;
  no_background_url: string | null;
  created_at: string | null;
  is_flagged: boolean | null;
  is_featured: boolean | null;
  error: string | null;
  status: string | null;
  user_id: string | null;
}

export default async function EmojiPage({ params }: PageProps) {
  const id = params?.id
  if (!id) {
    notFound()
  }

  const supabase = createClient()
  let emoji: EmojiData | null = null;
  let userEmail: string | null = null;

  try {
    const { data: emojiData, error: emojiError } = await supabase
      .from('emoji')
      .select('*')
      .eq('id', id)
      .single<EmojiData>()

    if (emojiError || !emojiData) {
      console.error(`Emoji fetch error for ID ${id}:`, emojiError);
      notFound()
    }
    emoji = emojiData;

    if (emoji && emoji.user_id) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(emoji.user_id);
      
      if (userError) {
          console.warn(`Could not fetch user data for user ${emoji.user_id}:`, userError.message);
      } else if (userData && userData.user) {
          userEmail = userData.user.email || null;
      }
    }

  } catch (error) {
    console.error(`Unexpected error fetching data for emoji ${id}:`, error);
    notFound();
  }

  if (!emoji) {
      notFound();
  }

  const displayImageUrl = emoji.no_background_url || emoji.original_url;
  const displayDate = emoji.created_at ? format(new Date(emoji.created_at), 'PPP', { locale: he }) : 'לא ידוע';
  const displayUsername = userEmail || (emoji.user_id ? `משתמש ${emoji.user_id.substring(0, 6)}...` : '@אנונימי');

  return (
    <div className="px-4 pt-8">
      <div className="max-w-5xl mx-auto bg-background rounded-lg border shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">

          <div className="flex-shrink-0 lg:w-1/2 flex flex-col items-center bg-stone-100 dark:bg-stone-900 p-6 md:p-8 rounded-l-lg">
            <div className="relative aspect-square w-full max-w-md rounded-lg overflow-hidden">
              {displayImageUrl ? (
                <Image
                  src={displayImageUrl}
                  alt={emoji.prompt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                  תמונה לא זמינה
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow lg:w-1/2 flex flex-col p-6 md:p-8 rounded-r-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                {(userEmail ? userEmail[0] : displayUsername[0]).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{displayUsername}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-6 break-words">
              {emoji.prompt}
            </h1>

            <div className="space-y-3 text-sm text-muted-foreground border-t border-b py-4 mb-6">
              <div className="flex justify-between">
                <span>מודל</span>
                <span className="text-foreground font-medium">Emoji</span>
              </div>
              <div className="flex justify-between">
                <span>מידות</span>
                <span className="text-foreground font-medium">768x768</span>
              </div>
              <div className="flex justify-between">
                <span>תאריך</span>
                <span className="text-foreground font-medium">{displayDate}</span>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <ActionButtons 
                displayImageUrl={displayImageUrl}
                emojiId={emoji.id}
                emojiPrompt={emoji.prompt}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

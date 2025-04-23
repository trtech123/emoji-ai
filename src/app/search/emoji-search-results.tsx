"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import Image from "next/image";
import { searchEmojisAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

// Define type based on Server Action return
interface EmojiResult {
    id: string;
    prompt: string | null;
    original_url: string | null;
    no_background_url: string | null;
}

export function EmojiSearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [emojis, setEmojis] = useState<EmojiResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmojis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await searchEmojisAction({ searchQuery: query, limit: 50 });
        if (result.success && result.emojis) {
          setEmojis(result.emojis);
        } else {
          setError(result.error || "חיפוש האימוג׳ים נכשל.");
          setEmojis([]);
        }
      } catch (err: any) {
        console.error("Error calling search action:", err);
        setError(err.message || "אירעה שגיאה.");
        setEmojis([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch whenever the query changes. 
    // Debouncing removed for simplicity for now.
    fetchEmojis(); 

  }, [query]); // Dependency array includes query

  return (
    <div className="w-full">
      {/* Optional: Display search term */ 
      }
      {query && (
        <h2 className="text-xl font-semibold text-center px-4 mb-6">
          תוצאות חיפוש עבור: "{query}"
        </h2>
      )}

      {/* Loading State */}
      {isLoading && (
          <div className="w-full grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 px-4">
              {/* Render Skeleton loaders */ 
              }
              {Array.from({ length: 20 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-lg" />
              ))}
          </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <p className="text-destructive text-center px-4">{error}</p>
      )}

      {/* Results Grid */}
      {!isLoading && !error && emojis.length > 0 && (
        <div className="w-full grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 px-4">
          {emojis.map((emoji) => {
            const imageUrl = emoji.no_background_url || emoji.original_url;
            if (!imageUrl) return null;
            
            return (
              <Link href={`/p/${emoji.id}`} key={emoji.id} className="block">
                <div className="aspect-square rounded-lg overflow-hidden relative hover:opacity-80 transition-opacity">
                  <Image
                    src={imageUrl}
                    alt={emoji.prompt || 'Generated Emoji'}
                    fill
                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 16.6vw, (max-width: 1024px) 12.5vw, 10vw"
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No Results State */}
      {!isLoading && !error && emojis.length === 0 && (
        <p className="text-muted-foreground text-center px-4">
          {query 
            ? `לא נמצאו תוצאות עבור "${query}".` 
            : "התחל לחפש אימוג׳י." // Initial state message
          }
        </p>
      )}
    </div>
  );
}

"use client"; // Needs to be client for input state later

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from "@/hooks/use-debounce";
import { createClient } from '@/lib/supabase/client';
import { signInWithGoogle } from '@/lib/auth-utils';
import toast from 'react-hot-toast';

// Simple debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

interface SearchBarProps {
  // Add props for search handling later, e.g., onSearch, initialValue
  className?: string; // Allow passing custom classes
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams();
      if (query) {
        params.set("q", query);
      }
      router.push(`/search?${params.toString()}`);
    },
    [router]
  );

  const handleInputFocus = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        toast.error('שגיאה בהתחברות עם Google');
        console.error('Error signing in with Google:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        toast.error('שגיאה בהתחברות עם Google');
        console.error('Error signing in with Google:', error);
      }
    } else {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="חיפוש אימוג'ים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          className="w-full pr-10 py-2 text-sm sm:text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
} 
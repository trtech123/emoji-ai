"use client"

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DialogTrigger } from "@/components/ui/dialog"
import type { User } from '@supabase/supabase-js'
import { LogIn, LogOut } from 'lucide-react'
import { signOutAction } from '../actions'
import toast from 'react-hot-toast'
import { SITE_URL, AUTH_CALLBACK_URL } from '@/lib/constants'
import { AuthDialog } from './auth-dialog'
import { signInWithGoogle } from '@/lib/auth-utils'
import Image from 'next/image'

export function AuthButton() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Add debug logging
    console.log("[AuthButton] Debug URLs:", {
      SITE_URL,
      AUTH_CALLBACK_URL,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
    });
    
    console.log("[AuthButton] useEffect running - Setting up listener");
    // Confirm execution context
    if (typeof window === 'undefined') {
      console.error("[AuthButton] ERROR: useEffect running on server?");
    } else {
      console.log("[AuthButton] useEffect running in browser context.");
    }

    let initialCheckDone = false; // Flag to prevent redundant checks

    // Function to check user and update state
    const checkUser = async () => {
      console.log("[AuthButton] Explicitly checking user state...");
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("[AuthButton] Error in checkUser:", error);
      }
      console.log("[AuthButton] checkUser result:", { userId: currentUser?.id });
      setUser(currentUser); // Update state based on explicit check
      initialCheckDone = true; 
    };

    // Listener for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AuthButton] onAuthStateChange triggered:", { _event, userId: session?.user?.id });
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("[AuthButton] User detected via onAuthStateChange, closing modal if open.");
        setIsOpen(false);
      }
    });

    // Initial check on mount
    if (!initialCheckDone) {
       checkUser();
    }

    // Add visibility change listener as a fallback
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[AuthButton] App became visible, re-checking user state...");
        // Call getUser and log the full response
        supabase.auth.getUser().then(response => {
          console.log("[AuthButton] getUser response on visibility change:", response);
          if(response.error) {
            console.error("[AuthButton] Error from getUser on visibility change:", response.error);
          }
          setUser(response.data.user ?? null);
        }).catch(err => {
          console.error("[AuthButton] Exception during getUser on visibility change:", err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      console.log("[AuthButton] useEffect cleanup - Unsubscribing and removing listener");
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase.auth]); // Dependency array remains the same

  const handleSignOut = async () => {
    console.log("[AuthButton] handleSignOut called - using Server Action");
    startTransition(async () => {
      const result = await signOutAction();
      if (result?.error) {
        toast.error(`Sign out failed: ${result.error}`);
        console.error("[AuthButton] Server Action sign out failed:", result.error);
      } else {
        console.log("[AuthButton] Server Action sign out successful (client-side perspective)");
        // No need to manually call setUser(null) here,
        // the redirect and subsequent page load/auth state listener will handle it.
      }
    });
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error('שגיאה בהתחברות עם Google')
      console.error('Error signing in with Google:', error)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Image
            src={user.user_metadata?.avatar_url || '/default-avatar.png'}
            alt={user.user_metadata?.user_metadata?.name || 'User avatar'}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} title="התנתק" disabled={isPending}>
          {isPending ? (
            <span className="animate-spin h-4 w-4">⏳</span>
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span className="sr-only">התנתק</span>
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" /> התחבר
    </Button>
  )
} 
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

export function AuthButton() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let initialCheckDone = false;

    const checkUser = async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("[AuthButton] Error in checkUser:", error);
      }
      setUser(currentUser);
      initialCheckDone = true; 
    };

    const handleAuthChange = async (user: User | null) => {
        setUser(user);
        if (user) {
            setIsOpen(false);
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthChange(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data }) => {
        supabase.auth.getSession().then(({ data: { session }}) => {
            if(!session) {
                handleAuthChange(data.user);
            }
        })
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    startTransition(async () => {
      const result = await signOutAction();
      if (result?.error) {
        toast.error(`Sign out failed: ${result.error}`);
      }
    });
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline-block">
          {user.email}
        </span>
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
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <LogIn className="mr-2 h-4 w-4" /> התחבר
      </Button>
      <AuthDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  )
} 
"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PlusSquare,
  Search,
  User,
  LogOut,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth-utils'
import { signOutAction } from '../actions'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui-store"
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

export function MobileBottomNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const supabase = createClient()
  const { openPaymentModal } = useUIStore()
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    }
    
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])
  
  const handleAuthRequiredAction = async (href: string) => {
    if (!user) {
      try {
        await signInWithGoogle()
      } catch (error) {
        toast.error('שגיאה בהתחברות עם Google')
        console.error('Error signing in with Google:', error)
      }
    } else {
      window.location.href = href
    }
  }

  const handleSignOut = async () => {
    startTransition(async () => {
      const result = await signOutAction();
      if (result?.error) {
        toast.error(`ההתנתקות נכשלה: ${result.error}`);
        console.error("Sign out failed:", result.error);
      }
      setShowSignOutDialog(false);
    });
  }
  
  const navItems = [
    { name: 'יצירה', href: '/', icon: PlusSquare, requiresAuth: true },
    { name: 'חיפוש', href: '/search', icon: Search, requiresAuth: true },
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => item.requiresAuth ? handleAuthRequiredAction(item.href) : window.location.href = item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </button>
            )
          })}
          
          {user && (
            <button
              key="purchase-credits"
              onClick={openPaymentModal}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                "text-muted-foreground"
              )}
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs mt-1">קרדיטים</span>
            </button>
          )}
          
          <button
            onClick={() => user ? setShowSignOutDialog(true) : handleAuthRequiredAction('/profile')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              pathname === '/profile' ? "text-primary" : "text-muted-foreground"
            )}
          >
            {user && user.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
            <span className="text-xs mt-1">פרופיל</span>
          </button>
        </nav>
      </div>

      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>התנתקות</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך להתנתק?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button 
              variant="default" 
              onClick={handleSignOut} 
              disabled={isPending}
            >
              {isPending ? (
                <span className="animate-spin mr-2 h-4 w-4">⏳</span>
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              התנתק
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSignOutDialog(false)}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 
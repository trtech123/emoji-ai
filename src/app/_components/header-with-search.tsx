"use client"

import { usePathname } from 'next/navigation'
import { SearchBar } from './search-bar'
import { AuthButton } from './auth-button'
import { cn } from '@/lib/utils'
import { BODY_PADDING } from '@/lib/constants'
import { Home, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"

export function HeaderWithSearch() {
  const pathname = usePathname()
  const isSearchPage = pathname === '/search'
  const isHomePage = pathname === '/'
  const isEmojiPage = pathname.startsWith('/p/')
  
  // State for user and mobile check
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const { openPaymentModal } = useUIStore()

  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      // Use innerWidth for client-side check
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768) // md breakpoint is 768px
    }
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Check user authentication state
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
  
  // Hide header on mobile for home and emoji pages
  if (isMobile && (isHomePage || isEmojiPage)) {
    return null
  }
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className={cn("container flex h-14 items-center justify-between", BODY_PADDING)}>
        {/* Right - Home button */}
        <Link href="/" className="hidden md:flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent">
          <Home className="h-4 w-4" />
        </Link>

        {/* Center - Search bar */}
        <div className={cn("flex-grow max-w-xl px-4", isSearchPage ? "block" : "hidden md:block")}>
          <SearchBar className="w-full" />
        </div>

        {/* Left - Auth button and Purchase Credits (Mobile) */}
        <div className={cn("flex items-center gap-2 flex-none", isSearchPage ? "hidden md:flex" : "flex")}>
          {/* Show Purchase Credits Button only on Mobile for logged-in users */} 
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" // Only show on mobile (below md breakpoint)
              onClick={openPaymentModal} 
              aria-label="רכוש קרדיטים"
            >
              <CreditCard className="h-5 w-5" />
            </Button>
          )}
          <AuthButton />
        </div>
      </div>
    </header>
  )
} 
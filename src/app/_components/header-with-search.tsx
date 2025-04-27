"use client"

import { usePathname } from 'next/navigation'
import { SearchBar } from './search-bar'
import { AuthButton } from './auth-button'
import { cn } from '@/lib/utils'
import { BODY_PADDING } from '@/lib/constants'
import { Home } from 'lucide-react'
import Link from 'next/link'

export function HeaderWithSearch() {
  const pathname = usePathname()
  const isSearchPage = pathname === '/search'
  const isHomePage = pathname === '/'
  const isEmojiPage = pathname.startsWith('/p/')
  
  // Hide header on mobile for home and emoji pages
  if ((isHomePage || isEmojiPage) && typeof window !== 'undefined' && window.innerWidth < 640) {
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

        {/* Left - Auth button */}
        <div className={cn("flex-none", isSearchPage ? "hidden md:block" : "")}>
          <AuthButton />
        </div>
      </div>
    </header>
  )
} 
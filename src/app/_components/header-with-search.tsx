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
      <div className={cn("container flex h-14 items-center gap-4", BODY_PADDING)}>
        {/* Hide title on mobile for search page */}
        <div className={cn("flex-none", isSearchPage ? "hidden md:block" : "")}>
          <span className="font-bold text-[10px] sm:text-lg text-transparent">אימוג׳י AI</span>
        </div>
        <div className={cn("flex-grow px-4", isSearchPage ? "block" : "hidden md:flex")}>
          <div className="w-full">
            <SearchBar className="max-w-xl mx-auto" />
          </div>
        </div>
        {/* Hide auth button on mobile for search page */}
        <nav className={cn("flex-none flex items-center gap-4", isSearchPage ? "hidden md:flex" : "")}>
          <AuthButton />
          <Link href="/" className="hidden md:flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent">
            <Home className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  )
} 
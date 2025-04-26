"use client"

import { usePathname } from 'next/navigation'
import { SearchBar } from './search-bar'
import { AuthButton } from './auth-button'
import { cn } from '@/lib/utils'
import { BODY_PADDING } from '@/lib/constants'

export function HeaderWithSearch() {
  const pathname = usePathname()
  const isSearchPage = pathname === '/search'
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className={cn("container flex h-14 items-center gap-4", BODY_PADDING)}>
        <div className="flex-none">
          <span className="font-bold text-[10px] sm:text-lg text-transparent">אימוג׳י AI</span>
        </div>
        <div className={cn("flex-grow px-4", isSearchPage ? "block" : "hidden md:flex")}>
          <div className="w-full">
            <SearchBar className="max-w-xl mx-auto" />
          </div>
        </div>
        <nav className="flex-none flex items-center">
          <AuthButton />
        </nav>
      </div>
    </header>
  )
} 
"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PlusSquare,
  Search,
  Home,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  
  const navItems = [
    { name: 'בית', href: '/', icon: Home },
    { name: 'יצירה', href: '/create', icon: PlusSquare },
    { name: 'חיפוש', href: '/search', icon: Search },
    { name: 'פרופיל', href: '/profile', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 
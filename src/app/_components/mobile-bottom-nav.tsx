"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PlusSquare,
  Search,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth-utils'
import toast from 'react-hot-toast'

export function MobileBottomNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
  
  const navItems = [
    { name: 'יצירה', href: '/', icon: PlusSquare, requiresAuth: true },
    { name: 'חיפוש', href: '/search', icon: Search, requiresAuth: true },
    { name: 'פרופיל', href: '/profile', icon: User, requiresAuth: true },
  ]

  return (
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
      </nav>
    </div>
  )
} 
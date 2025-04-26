"use client"

import Link from 'next/link'
import {
  PlusSquare,
  Search,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth-utils'
import toast from 'react-hot-toast'

export default function RightSidebar() {
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    // Initial check
    checkIfMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

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

  const sidebarItems = [
    { name: 'יצירה', href: '/', icon: PlusSquare, requiresAuth: true },
    { name: 'חיפוש', href: '/search', icon: Search, requiresAuth: true },
  ]

  return (
    <aside className={`${isMobile ? 'w-22' : 'w-64'} border-r bg-neutral-50 dark:bg-neutral-950 p-4 flex flex-col flex-shrink-0 sticky top-[56px] z-30 h-[calc(100vh-56px)] overflow-y-auto`}>
      <nav className="flex-grow">
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => item.requiresAuth ? handleAuthRequiredAction(item.href) : window.location.href = item.href}
                className={`flex items-center gap-2 px-2 py-2 ${isMobile ? 'text-[10px]' : 'text-sm'} font-medium rounded-md hover:bg-accent w-full`}
              >
                <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

// Define placeholder icons if not using a library like lucide-react
// const Create = () => <span>C</span>;
// const Search = () => <span>S</span>;
// const Feedback = () => <span>F</span>;
// const AppStore = () => <span>iOS</span>;
// const Android = () => <span>A</span>;
// const Discord = () => <span>D</span>;
// const Slack = () => <span>Sl</span>; 
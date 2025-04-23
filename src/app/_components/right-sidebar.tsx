"use client"

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  PlusSquare, // Changed from Create
  Search, 
  MessageSquare, // Changed from Feedback
  Apple, // Changed from AppStore
  Smartphone, // Changed from Android
  Webhook, // Changed from Discord
  Slack,
  LogIn,
  LogOut
} from 'lucide-react'
import AuthButton from './auth-button'

export default function RightSidebar() {
  // Placeholder links - replace with actual paths or functionality
  const sidebarItems = [
    { name: 'יצירה', href: '/', icon: PlusSquare },
    { name: 'חיפוש', href: '/search', icon: Search },
    { name: 'משוב', href: '#', icon: MessageSquare, external: true },
  ]

  const integrations = [
    { name: 'אפליקציית iOS', href: '#', icon: Apple, external: true },
    { name: 'אפליקציית אנדרואיד', href: '#', icon: Smartphone, external: true },
    { name: 'בוט דיסקורד', href: '#', icon: Webhook, external: true },
    { name: 'אינטגרציית סלאק', href: '#', icon: Slack, external: true },
  ]

  return (
    <aside className="w-64 border-r bg-neutral-50 dark:bg-neutral-950 p-4 flex flex-col flex-shrink-0 sticky top-[56px] z-30 h-[calc(100vh-56px)] overflow-y-auto">
      <nav className="flex-grow">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase mb-2">כללי</h2>
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="text-xs font-semibold text-muted-foreground uppercase mt-6 mb-2">אפליקציות ואינטגרציות</h2>
        <ul>
          {integrations.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.name}</span>
                {item.external && <span className="text-xs text-muted-foreground">(חיצוני)</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Login/Logout Button at the bottom */}
      <div className="mt-auto pt-4 border-t">
        {/* Reuse the AuthButton component which already handles state and modals */}
        {/* It will need translation applied separately */}
        <AuthButton />
      </div>
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
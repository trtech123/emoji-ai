'use client';

import { cn } from "@/lib/utils"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import "../globals.css"
import { Toaster } from "react-hot-toast"
import RightSidebar from "./right-sidebar"
import { BODY_PADDING } from "@/lib/constants"
import { MobileInputFix } from "./mobile-input-fix"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { HeaderWithSearch } from "./header-with-search"
import { PaymentDialog } from "./payment-dialog"
import { useUIStore } from "@/stores/ui-store"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

const inter = Inter({ subsets: ["latin"] })

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { isPaymentModalOpen, closePaymentModal } = useUIStore();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: import('@supabase/supabase-js').Session | null) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className={cn("antialiased font-sans scroll-smooth", inter.className)}>
        <MobileInputFix />
        <div className="flex flex-row min-h-screen">
          <div className="hidden md:block">
            <RightSidebar />
          </div>
          <div className="flex flex-col flex-grow">
            <HeaderWithSearch />
            <main className={cn("flex-grow flex items-stretch flex-col pb-16 md:pb-0", BODY_PADDING)}>
              <Providers>{children}</Providers>
            </main>
          </div>
        </div>
        <MobileBottomNav />
        <Toaster position="bottom-left" />
        <PaymentDialog
          open={isPaymentModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              closePaymentModal();
            }
          }}
          userId={user?.id ?? null}
        />
      </body>
    </html>
  )
} 
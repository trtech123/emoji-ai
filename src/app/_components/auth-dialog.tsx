"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SITE_URL } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AuthDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ isOpen, onOpenChange }: AuthDialogProps) {
  const supabase = createClient()
  const [isMobile, setIsMobile] = useState(false)

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

  // Common auth appearance configuration
  const authAppearance = {
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: '#404040',
          brandAccent: '#2d2d2d'
        }
      }
    },
    style: {
      container: {
        width: '100%'
      },
      button: {
        flex: 1,
        width: '100%',
        padding: isMobile ? '16px' : '12px',
        height: 'auto',
        fontSize: isMobile ? '14px' : '16px',
        justifyContent: 'center',
        borderRadius: '8px',
        marginBottom: '0'
      },
      divider: {
        display: 'none'
      },
      message: {
        padding: '12px',
        fontSize: isMobile ? '12px' : '14px',
        borderRadius: '8px'
      },
      label: {
        fontSize: isMobile ? '12px' : '14px'
      },
      input: {
        fontSize: isMobile ? '12px' : '14px'
      }
    }
  }

  // Mobile UI - Full screen
  if (isMobile && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">התחברות או הרשמה</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[50%] ml-auto">
            <Auth
              supabaseClient={supabase}
              appearance={authAppearance}
              theme="dark"
              providers={['google']}
              onlyThirdPartyProviders
              redirectTo={`${SITE_URL}/auth/callback`}
              view="sign_in"
              showLinks={false}
            />
          </div>
        </div>
      </div>
    )
  }

  // Desktop UI - Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl sm:text-xl">התחברות או הרשמה</DialogTitle>
          <DialogDescription className="text-base sm:text-sm">
            התחבר כדי ליצור אימוג&apos;ים.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center py-6 sm:py-4">
          <Auth
            supabaseClient={supabase}
            appearance={authAppearance}
            theme="dark"
            providers={['google']}
            onlyThirdPartyProviders
            redirectTo={`${SITE_URL}/auth/callback`}
            view="sign_in"
            showLinks={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 
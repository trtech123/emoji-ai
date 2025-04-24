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

interface AuthDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ isOpen, onOpenChange }: AuthDialogProps) {
  const supabase = createClient()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl sm:text-xl">התחברות או הרשמה</DialogTitle>
          <DialogDescription className="text-base sm:text-sm">
            התחבר כדי ליצור אימוג׳ים.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center py-6 sm:py-4">
          <Auth
            supabaseClient={supabase}
            appearance={{
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
                  padding: '12px',
                  height: 'auto',
                  fontSize: '16px',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  marginBottom: '0'
                },
                divider: {
                  display: 'none'
                },
                message: {
                  padding: '12px',
                  fontSize: '14px',
                  borderRadius: '8px'
                }
              }
            }}
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
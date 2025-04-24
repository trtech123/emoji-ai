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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>התחברות או הרשמה</DialogTitle>
          <DialogDescription>
            התחבר כדי ליצור אימוג&apos;ים.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
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
                button: {
                  flex: 1,
                  width: '100%',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }
              }
            }}
            theme="dark"
            providers={['google']}
            onlyThirdPartyProviders
            redirectTo={SITE_URL}
            view="sign_in"
            showLinks={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 
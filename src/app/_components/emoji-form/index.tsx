"use client"

import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { Loader2, Sparkles, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import Link from "next/link"
import { AuthDialog } from "../auth-dialog"

interface Profile {
  id: string
  updated_at: string | null
  generation_credits: number
  is_admin: boolean
}

const DEFAULT_GENERATION_CREDITS = 1;

interface EmojiFormProps {
  initialPrompt?: string
}

export function EmojiForm({ initialPrompt }: EmojiFormProps) {
  const supabase = createClient()
  const formRef = useRef<HTMLFormElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfile = async (currentUser: User) => {
      setIsLoadingProfile(true);
      setError(null);
      let profileData: Profile | null = null;

      try {
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, generation_credits, is_admin, updated_at')
          .eq('id', currentUser.id)
          .single();

        if (existingProfile) {
          profileData = existingProfile as Profile;
        } else if (fetchError && fetchError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ 
              id: currentUser.id, 
              generation_credits: DEFAULT_GENERATION_CREDITS,
              is_admin: false
            })
            .select('id, generation_credits, is_admin, updated_at')
            .single();

          if (insertError) {
            throw new Error("שגיאה ביצירת פרופיל המשתמש שלך.");
          } else if (newProfile) {
            profileData = newProfile as Profile;
          } else {
            throw new Error("אירעה שגיאה בלתי צפויה ביצירת הפרופיל.");
          }
        } else if (fetchError) {
          throw fetchError;
        } else {
          throw new Error("אירעה שגיאה בלתי צפויה בטעינת הפרופיל.");
        }
        
        setUserProfile(profileData);

      } catch (err: any) {
        setError(err.message || "לא ניתן לטעון או ליצור את הפרופיל שלך.");
        setUserProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const handleAuthChange = async (user: User | null) => {
        setUser(user);
        if (user) {
            await fetchUserProfile(user);
        } else {
            setUserProfile(null);
            setIsLoadingProfile(false);
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthChange(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data }) => {
        supabase.auth.getSession().then(({ data: { session }}) => {
            if(!session) {
                handleAuthChange(data.user);
            }
        })
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (initialPrompt && textAreaRef.current) {
      textAreaRef.current.value = initialPrompt;
    }
  }, [initialPrompt]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    if (isSubmitting || isLoadingProfile) {
      return;
    }

    if (!user) {
      setError("אנא התחבר כדי ליצור אימוג׳ים.");
      setShowLoginModal(true);
      toast.error("אנא התחבר תחילה.");
      return;
    }

    if (!userProfile) {
        setError("לא ניתן היה לטעון או ליצור את הפרופיל שלך. אנא רענן את הדף ונסה שוב.");
        toast.error("לא ניתן לטעון פרופיל. נסה לרענן.");
        return;
    }

    const formData = new FormData(formRef.current!); 
    const promptValue = formData.get("prompt");

    if (typeof promptValue !== 'string' || !promptValue.trim()) { 
      setError("אנא הזן תיאור תקין.");
      toast.error("אנא הזן תיאור תקין.");
      return;
    }
    
    const prompt = promptValue; 

    setIsSubmitting(true);
    setError(null);
    setShowLoginModal(false);

    const isAdmin = userProfile.is_admin;
    const availableCredits = userProfile.generation_credits;

    if (!isAdmin && availableCredits <= 0) {
      setError("נגמרו לך קרדיטי היצירה.");
      toast.error("אין לך מספיק קרדיטים.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/emojis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 401) {
        setError("שגיאת אימות. אנא התחבר שוב.");
        setShowLoginModal(true);
        toast.error("אנא התחבר שוב.");
        return;
      }

      if (response.status === 402) {
        setError("נגמרו לך קרדיטי היצירה.");
        toast.error("אין לך מספיק קרדיטים.");
        setIsSubmitting(false); 
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `הבקשה נכשלה עם סטטוס ${response.status}` }));
        throw new Error(errorData.error || `הבקשה נכשלה עם סטטוס ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.id) {
        throw new Error(
          data?.error || "היצירה הצליחה אך לא התקבל מזהה אימוג׳י."
        );
      }

      if (!isAdmin) {
        setUserProfile(prev => prev ? { ...prev, generation_credits: Math.max(0, prev.generation_credits - 1) } : null);
      }

      router.push(`/p/${data.id}`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "אירעה שגיאה לא ידועה.";
      setError(err instanceof Error ? err.message : errorMsg);
      toast.error(err instanceof Error ? err.message : errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textAreaRef}
            id="prompt-input"
            defaultValue={initialPrompt}
            name="prompt"
            required
            placeholder="תאר את התמונה שלך (למשל, חתול אסטרונאוט)"
            className="pr-14 py-3 pl-12 text-[10px] sm:text-base resize-none border rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
            rows={3}
            disabled={isSubmitting || isLoadingProfile}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !(isSubmitting || isLoadingProfile)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingProfile}
            size="icon"
            variant="default"
            className="absolute bottom-3 left-3 rounded-lg bg-black hover:bg-black/90"
            aria-label="צור אימוג׳י"
          >
            {isSubmitting || isLoadingProfile ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 transform scale-x-[-1]" />
            )}
          </Button>
        </div>
      </form>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      <AuthDialog isOpen={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  )
}

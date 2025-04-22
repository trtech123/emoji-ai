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

interface Profile {
  id: string
  updated_at: string | null
  generation_credits: number
  is_admin: boolean
}

interface EmojiFormProps {
  initialPrompt?: string
}

export function EmojiForm({ initialPrompt }: EmojiFormProps) {
  const supabase = createClient()
  const formRef = useRef<HTMLFormElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedEmoji, setGeneratedEmoji] = useState<{
    id: string
    status: string
    prompt: string
    imageUrl?: string
    error?: string
  } | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showOutOfTokensModal, setShowOutOfTokensModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfile = async (currentUser: User) => {
      console.log(`[EmojiForm] Attempting to fetch profile for user: ${currentUser.id}`);
      setIsLoadingProfile(true);
      setError(null);
      let profileData = null;
      let fetchError = null;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, generation_credits, is_admin, updated_at') 
          .eq('id', currentUser.id)
          .single();
          
        fetchError = error;
        profileData = data;

        if (fetchError) {
          console.error(`[EmojiForm] Error fetching profile for ${currentUser.id}:`, fetchError);
          if (fetchError.code === 'PGRST116') { // Profile not found
             console.warn(`[EmojiForm] Profile not found for user: ${currentUser.id}`);
             setUserProfile(null);
          } else {
            // Throw other errors to be caught by the outer catch block
            throw fetchError; 
          }
        } else if (profileData) {
          console.log(`[EmojiForm] Successfully fetched profile for ${currentUser.id}:`, profileData);
          setUserProfile(profileData as Profile);
        } else {
           console.warn(`[EmojiForm] Profile fetch returned no data and no error for ${currentUser.id}`);
           setUserProfile(null);
        }
      } catch (err: any) {
        // Catch errors thrown from the try block (like non-PGRST116 errors)
        console.error(`[EmojiForm] CATCH block: Error processing profile fetch for ${currentUser.id}:`, err);
        setError("לא ניתן לטעון פרופיל שלך. אנא נסה שוב מאוחר יותר.");
        setUserProfile(null);
      } finally {
        console.log(`[EmojiForm] FINALLY block: Setting isLoadingProfile to false for ${currentUser.id}`);
        setIsLoadingProfile(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log(`[EmojiForm] onAuthStateChange: User detected (${session.user.id}), fetching profile.`);
        await fetchUserProfile(session.user);
      } else {
        console.log(`[EmojiForm] onAuthStateChange: User logged out.`);
        setUserProfile(null);
        setIsLoadingProfile(false); // Ensure loading is false on logout
      }
    });
    supabase.auth.getUser().then(async ({ data: { user: currentUser } }) => {
      if (currentUser) {
         console.log(`[EmojiForm] Initial getUser: User detected (${currentUser.id}), fetching profile.`);
        await fetchUserProfile(currentUser);
      } else {
         console.log(`[EmojiForm] Initial getUser: No user detected.`);
        setIsLoadingProfile(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (initialPrompt && textAreaRef.current) {
      textAreaRef.current.value = initialPrompt;
    }
  }, [initialPrompt]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (isSubmitting || !formRef.current || isLoadingProfile) return;

    if (!user) {
      setError("אנא התחבר כדי ליצור אימוג'ים.");
      setShowLoginModal(true);
      toast.error("אנא התחבר תחילה.");
      return;
    }

    const formData = new FormData(formRef.current);
    const prompt = formData.get("prompt") as string;

    if (!prompt?.trim()) {
      setError("אנא הזן תיאור.");
      toast.error("אנא הזן תיאור.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setGeneratedEmoji(null);
    setShowLoginModal(false);
    setShowOutOfTokensModal(false);

    if (!userProfile) {
        setError("לא ניתן היה לטעון את נתוני הפרופיל שלך. אנא המתן רגע או רענן.");
        toast.error("לא ניתן לטעון פרופיל. נסה שוב.");
        setIsSubmitting(false);
        return;
    }

    const isAdmin = userProfile.is_admin;
    const availableCredits = userProfile.generation_credits;

    if (!isAdmin && availableCredits <= 0) {
      setError("נגמרו לך קרדיטי היצירה.");
      setShowOutOfTokensModal(true);
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
        setShowOutOfTokensModal(true);
        toast.error("אין לך מספיק קרדיטים.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `הבקשה נכשלה עם סטטוס ${response.status}` }));
        throw new Error(errorData.error || `הבקשה נכשלה עם סטטוס ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.id || data.status !== "generated") {
        throw new Error(
          data?.error || "היצירה הצליחה אך פורמט התגובה שגוי."
        );
      }

      if (!isAdmin) {
        const { error: decrementError } = await supabase.rpc('decrement_credits', { p_user_id: user.id });

        if (decrementError) {
          console.error("Failed to decrement credits:", decrementError);
          toast.error("שגיאה בעדכון ספירת הקרדיטים. אנא פנה לתמיכה.");
        } else {
          setUserProfile(prev => prev ? { ...prev, generation_credits: Math.max(0, prev.generation_credits - 1) } : null);
          toast.success("אימוג'י נוצר! קרדיט נוצל.");
        }
      } else {
         toast.success("אימוג'י נוצר!");
      }

      setGeneratedEmoji({
        id: data.id,
        status: "generated",
        prompt: data.prompt,
        imageUrl: data.no_background_url,
        error: undefined,
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "אירעה שגיאה לא ידועה.";
      console.error("handleSubmit Error:", err);
      setError(err instanceof Error ? err.message : errorMsg);
      toast.error(err instanceof Error ? err.message : errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <form ref={formRef} onSubmit={handleSubmit} className="relative w-full">
        <Textarea
          ref={textAreaRef}
          id="prompt-input"
          defaultValue={initialPrompt}
          name="prompt"
          required
          placeholder="תאר את התמונה שלך (למשל, חתול אסטרונאוט)"
          className="pr-14 py-3 pl-4 text-base resize-none border rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
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
          className="absolute bottom-3 left-3 rounded-lg"
          aria-label="צור אימוג'י"
        >
          {isSubmitting || isLoadingProfile ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 transform scale-x-[-1]" />
          )}
        </Button>
      </form>

      {/* Always show error if it exists, add margin */}
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      {(isSubmitting || generatedEmoji) && (
        <div className="flex flex-col items-center gap-4 pt-6 mt-6 border-t">
          {isSubmitting && !generatedEmoji && (
            <>
              <Skeleton className="h-48 w-48 rounded-lg" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>יוצר... (DALL-E &gt; Cloudinary)</span>
              </div>
            </>
          )}
          
          {generatedEmoji && (
            <>
              {generatedEmoji.status === 'generated' && generatedEmoji.imageUrl && (
                <a 
                  href={generatedEmoji.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="לחץ לפתיחת תמונה מלאה"
                >
                  <img
                    src={generatedEmoji.imageUrl}
                    alt={generatedEmoji.prompt}
                    className="w-48 h-48 object-contain rounded-lg bg-secondary p-2 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </a>
              )}
              {generatedEmoji.status === 'failed' && generatedEmoji.error && (
                <p className="text-sm text-destructive mt-2 text-center">
                  <span className="font-semibold">שגיאה:</span> {generatedEmoji.error}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>נדרשת התחברות</DialogTitle>
            <DialogDescription>
              אנא התחבר או הירשם כדי ליצור אימוג'ים.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Auth 
               supabaseClient={supabase} 
               appearance={{ theme: ThemeSupa }} 
               theme="dark" 
               redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOutOfTokensModal} onOpenChange={setShowOutOfTokensModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>אזלו הקרדיטים</DialogTitle>
            <DialogDescription>
              נגמרו לך קרדיטי היצירה החינמיים או שרכשת. לרכישת קרדיטים נוספים, לחץ על הכפתור.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button asChild>
              <Link href="/billing">רכוש קרדיטים נוספים</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

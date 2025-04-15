"use client"

import { useEffect, useRef, useState } from "react"
import { SubmitButton } from "./submit-button"
import toast from "react-hot-toast"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmojiFormProps {
  initialPrompt?: string
}

export function EmojiForm({ initialPrompt }: EmojiFormProps) {
  const submitRef = useRef<React.ElementRef<"button">>(null)
  const [token, setToken] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedEmoji, setGeneratedEmoji] = useState<{
    id: string
    status: string
    prompt: string
    imageUrl?: string
    replicate_id: string
    error?: string
  } | null>(null)
  const router = useRouter()

  // Poll for emoji updates
  useEffect(() => {
    if (!generatedEmoji || generatedEmoji.status !== 'generating') return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/prediction/${generatedEmoji.replicate_id}`)
        if (!response.ok) return
        
        const data = await response.json()
        
        if (data.status === "succeeded" && data.output?.[0]) {
          setGeneratedEmoji(prev => ({
            ...prev!,
            status: 'generated',
            imageUrl: data.output[0]
          }))
          setIsSubmitting(false)
          clearInterval(pollInterval)
        } else if (data.status === "failed") {
          setGeneratedEmoji(prev => ({
            ...prev!,
            status: 'failed',
            error: data.error || 'Failed to generate emoji'
          }))
          setIsSubmitting(false)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("Error polling prediction status:", error)
        setIsSubmitting(false)
      }
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [generatedEmoji?.replicate_id, generatedEmoji?.status])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!token) {
      console.error("No token available")
      toast.error("Please wait for authentication...")
      return
    }
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    submitRef.current?.focus()
    
    const formData = new FormData(e.currentTarget)
    const prompt = formData.get("prompt") as string

    try {
      const response = await fetch("/api/emojis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate emoji")
      }

      const data = await response.json()
      
      if (!data || !data.id) {
        setError("Failed to generate emoji. Please try again.")
        setIsSubmitting(false)
        return
      }

      setGeneratedEmoji(data)
      router.push(`/p/${data.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const { data, error: swrError } = useSWR(
    "/api/token",
    async (url: string) => {
      const res = await fetch(url)
      const json = await res.json()
      return json?.token ?? ""
    },
    {
      onSuccess: (token) => {
        setToken(token)
      },
      onError: (err) => {
        console.error("Error fetching token:", err)
      }
    }
  )

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="bg-black rounded-xl shadow-lg h-fit flex flex-row px-1 items-center w-full">
        <input
          defaultValue={initialPrompt}
          type="text"
          name="prompt"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submitRef.current?.click()
            }
          }}
          placeholder="cat"
          className="bg-transparent text-white placeholder:text-gray-400 ring-0 outline-none resize-none py-2.5 px-2 font-mono text-sm h-10 w-full transition-all duration-300"
          disabled={isSubmitting}
        />
        <SubmitButton ref={submitRef} disabled={isSubmitting} />
      </form>

      {generatedEmoji && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-white text-xl font-mono">
            {generatedEmoji.prompt}
          </div>
          
          {generatedEmoji.status === 'generating' ? (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="animate-spin" />
              <span>Generating emoji...</span>
            </div>
          ) : generatedEmoji.imageUrl ? (
            <img
              src={generatedEmoji.imageUrl}
              alt={generatedEmoji.prompt}
              className="w-64 h-64 object-contain"
            />
          ) : (
            <div className="text-white">Failed to generate emoji</div>
          )}
        </div>
      )}
    </div>
  )
}

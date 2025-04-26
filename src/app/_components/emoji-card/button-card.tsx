"use client"

import { EMOJI_SIZE } from "@/lib/constants"
import { track } from "@vercel/analytics"
import { Download } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Loader } from "../loader"
import { cn, formatPrompt } from "@/lib/utils"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { DownloadButton } from "./download-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ButtonCardProps {
  id: string
  prompt: string
  imageUrl: string
  createdAt: string
  alwaysShowDownloadBtn?: boolean
}

function downloadBlob(blobUrl: string, filename: string) {
  let a = document.createElement("a")
  a.download = filename
  a.href = blobUrl
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function fetcher(url: string) {
  return fetch(url)
    .then((res) => res.json())
    .then((json) => ({
      recentSrc: json.emoji.noBackgroundUrl,
      error: json.emoji.error,
    }))
}

export function ButtonCard({ id, prompt, imageUrl, createdAt, alwaysShowDownloadBtn }: ButtonCardProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: false })
    .replace('about ', '')
    .replace(' minutes', '')
    .replace(' minute', '')
    .replace(' hours', '')
    .replace(' hour', '')
    .replace(' days', '')
    .replace(' day', '')
    .split(' ')[0]

  const getHebrewTimeUnit = (time: string) => {
    const num = parseInt(time)
    if (num === 1) {
      return 'דקה'
    }
    return 'דקות'
  }

  const hebrewTime = `לפני ${timeAgo} ${getHebrewTimeUnit(timeAgo)}`

  const [isLoadingImage, setIsLoadingImage] = useState(true)

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        "group aspect-square w-full overflow-hidden rounded-xl bg-gray-100"
      )}
    >
      <Button
        variant="ghost"
        className="w-full h-full p-0"
        onClick={() => {
          // Implement the click handler
        }}
        disabled={isLoadingImage}
      >
        <div className="relative w-full h-full">
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Image
            src={imageUrl}
            alt={prompt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain p-3 sm:p-8 transition-transform duration-200 group-hover:scale-110"
            onLoad={() => setIsLoadingImage(false)}
          />
        </div>
      </Button>
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-200",
          "hover:opacity-100",
          alwaysShowDownloadBtn && "opacity-100"
        )}
      >
        <div className="flex flex-row items-center justify-between gap-x-4">
          <div className="flex flex-col">
            <p className="text-white font-medium line-clamp-1">{prompt}</p>
            <p className="text-gray-200 text-sm" dir="rtl">{hebrewTime}</p>
          </div>
          <DownloadButton
            imageUrl={imageUrl}
            prompt={prompt}
            id={id}
            className="shrink-0"
            alwaysShow={alwaysShowDownloadBtn}
          />
        </div>
      </div>
    </Card>
  )
}

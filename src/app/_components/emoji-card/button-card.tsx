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
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
      <img
        src={imageUrl}
        alt={prompt}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-sm text-white">{formatPrompt(prompt)}</p>
          <p className="text-xs text-white/80">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      <DownloadButton
        id={id}
        imageUrl={imageUrl}
        prompt={prompt}
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        alwaysShow={alwaysShowDownloadBtn}
      />
    </div>
  )
}

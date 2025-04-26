"use client"

import { useEffect } from 'react'

export function MobileInputFix() {
  useEffect(() => {
    // Add a style tag to the document head
    const style = document.createElement('style')
    style.innerHTML = `
      @media (max-width: 640px) {
        input, textarea, select {
          font-size: 16px !important;
        }
      }
    `
    document.head.appendChild(style)

    // Clean up on unmount
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
} 
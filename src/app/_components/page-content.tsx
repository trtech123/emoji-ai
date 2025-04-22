"use client"

import { EmojiForm } from "./emoji-form"
import { ExamplePrompts } from "./example-prompts"
import { FeaturedEmojis } from "./featured-emojis"
import Image from 'next/image' // Import next/image
import { useState } from "react"

export function PageContent() {
  const [prompt, setPrompt] = useState("")

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12 lg:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        {/* Header can go here if needed, or remove this outer div if not */}
      </div>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center mt-12 md:mt-16 lg:mt-20">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">אימוג'י</span> AI
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8">
          נוצר <span className="font-semibold text-foreground">בשבילכם</span> על ידכם
        </p>
        {/* Hero Image - Point to the correct file */}
        <Image 
          src="/emoji-showcase.png" // Updated path
          alt="תצוגת אימוג'ים שנוצרו על ידי AI" // Translated Alt text
          width={350} // Halved from 700
          height={150} // Halved from 300
          className="rounded-lg relative translate-x-5" 
          priority // Add priority if it's above the fold
        />
      </section>

      {/* Form Section */}
      <section className="w-full max-w-2xl flex flex-col items-center gap-4 mb-16">
        {/* Pass prompt state and setter to the form */}
        <EmojiForm initialPrompt={prompt} key={prompt} /> 
        {/* Example Prompts Component - Pass setter to update prompt */}
        <ExamplePrompts setPrompt={setPrompt} />
      </section>

      {/* Featured Emojis Section (Keep existing) */}
      <FeaturedEmojis />

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        {/* Footer content can go here */}
      </div>
    </main>
  )
} 
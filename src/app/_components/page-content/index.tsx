import { Suspense } from "react"
import { EmojiForm } from "../emoji-form"
import Image from 'next/image'

interface PageContentProps extends React.PropsWithChildren {
  prompt?: string
}

export const PageContent = ({ children, prompt }: PageContentProps) => {
  return (
    <div className="flex flex-col items-center">
      {/* Title Section */}
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-2">
        <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">אימוג׳י</span> AI
      </h1>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8">
        נוצר <span className="font-semibold text-foreground">בשבילכם</span> על ידכם
      </p>

      {/* Main Content Container */}
      <div className="flex flex-col items-center w-full max-w-md">
        {/* Showcase Image */}
        <div className="w-full flex justify-start -ml-12">
          <Image 
            src="/emoji-showcase.png"
            alt="תצוגת אימוג׳ים שנוצרו על ידי AI"
            width={350}
            height={150}
            className="rounded-t-lg"
            priority
          />
        </div>

        {/* Prompt Form */}
        <div className="w-full -mt-2">
          <EmojiForm initialPrompt={prompt} />
        </div>

        {/* Example Prompts */}
        {children}
      </div>
    </div>
  )
}

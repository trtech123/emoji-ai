import { Suspense } from "react"
import { EmojiForm } from "../emoji-form"
import Image from 'next/image'

interface PageContentProps extends React.PropsWithChildren {
  prompt?: string
}

export const PageContent = ({ children, prompt }: PageContentProps) => {
  return (
    <div className="flex flex-col items-center min-h-screen w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Title Section */}
      <div className="text-center w-full max-w-[90%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-2 sm:mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">אימוג׳י</span> AI
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">
          נוצר <span className="font-semibold text-foreground">בשבילכם</span> על ידכם
        </p>
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col items-center w-full max-w-[95%] sm:max-w-md md:max-w-lg mx-auto">
        {/* Showcase Image */}
        <div className="w-full flex justify-center sm:justify-start sm:-ml-10 md:-ml-20 mb-0">
          <Image 
            src="/emoji-showcase.png"
            alt="תצוגת אימוג׳ים שנוצרו על ידי AI"
            width={350}
            height={150}
            className="w-[220px] sm:w-[280px] md:w-[350px] h-auto"
            priority
          />
        </div>

        {/* Prompt Form */}
        <div className="w-full -mt-1">
          <EmojiForm initialPrompt={prompt} />
        </div>

        {/* Example Prompts */}
        <div className="w-full mt-4 sm:mt-6 md:mt-8">
          {children}
        </div>
      </div>
    </div>
  )
}

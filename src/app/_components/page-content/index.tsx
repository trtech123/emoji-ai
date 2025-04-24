import { Suspense } from "react"
import { EmojiForm } from "../emoji-form"
import Image from 'next/image'
import Head from 'next/head'

interface PageContentProps extends React.PropsWithChildren {
  prompt?: string
}

export const PageContent = ({ children, prompt }: PageContentProps) => {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="flex min-h-[100dvh] flex-col items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-screen-xl mx-auto">
        {/* Title Section */}
        <div className="text-center w-full max-w-[95%] sm:max-w-2xl lg:max-w-3xl mx-auto mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">אימוג׳י</span> AI
          </h1>
          <p className="text-base sm:text-lg lg:text-2xl text-muted-foreground leading-relaxed">
            נוצר <span className="font-semibold text-foreground">בשבילכם</span> על ידכם
          </p>
        </div>

        {/* Main Content Container */}
        <div className="flex flex-col items-center w-full max-w-[95%] sm:max-w-xl lg:max-w-2xl mx-auto">
          {/* Showcase Image */}
          <div className="w-full flex justify-end mb-0 -mr-8 sm:-mr-10 lg:-mr-12">
            <Image 
              src="/emoji-showcase.png"
              alt="תצוגת אימוג׳ים שנוצרו על ידי AI"
              width={350}
              height={150}
              className="w-[250px] sm:w-[300px] lg:w-[350px] h-auto rounded-t-xl"
              priority
            />
          </div>

          {/* Prompt Form */}
          <div className="w-full">
            <EmojiForm initialPrompt={prompt} />
          </div>

          {/* Example Prompts */}
          <div className="w-full mt-6 sm:mt-8">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import { Button } from "@/components/ui/button"

interface ExamplePromptsProps {
  setPrompt: (prompt: string) => void;
}

// Translated prompts
const prompts = [
  "קוסם פינגווין",
  "חתול מרכיב משקפי שמש",
  "קאפקייק עם ציפוי ורוד",
  "כריש עם כובע צילינדר",
  "כלב אסטרונאוט על הירח",
];

export function ExamplePrompts({ setPrompt }: ExamplePromptsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {prompts.map((p) => (
        <Button 
          key={p}
          variant="outline"
          size="sm"
          onClick={() => setPrompt(p)}
          className="text-xs md:text-sm"
        >
          {p}
        </Button>
      ))}
    </div>
  )
} 
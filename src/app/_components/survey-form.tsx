import { useState, ChangeEvent } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'

interface SurveyFormProps {
  question: string
  onNext: () => void
  onPrevious: () => void
  currentStep?: number
  totalSteps?: number
}

export function SurveyForm({ 
  question, 
  onNext, 
  onPrevious, 
  currentStep = 1, 
  totalSteps = 3 
}: SurveyFormProps) {
  const [answer, setAnswer] = useState('')
  const progress = (currentStep / totalSteps) * 100

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg p-8 space-y-6">
        {/* Question */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{question}</h2>
          <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Input */}
        <Input
          value={answer}
          onChange={handleChange}
          placeholder="Type your answer here..."
          className="w-full text-lg py-6"
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            className="min-w-[100px]"
          >
            Previous
          </Button>
          <Button
            onClick={onNext}
            className="min-w-[100px]"
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  )
} 
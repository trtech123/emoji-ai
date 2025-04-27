'use client'

import { useState } from 'react'
import { SurveyForm } from '@/app/_components/survey-form'

const questions = [
  'How do you typically respond to criticism?',
  'What motivates you the most?',
  'How do you handle stress?'
]

export default function SurveyPage() {
  const [currentStep, setCurrentStep] = useState(1)

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <SurveyForm
      question={questions[currentStep - 1]}
      currentStep={currentStep}
      totalSteps={questions.length}
      onNext={handleNext}
      onPrevious={handlePrevious}
    />
  )
} 
import { CornerDownLeft } from "lucide-react"
import React from "react"
import { Loader } from "../loader"

interface SubmitButtonProps {
  disabled?: boolean
}

export const SubmitButton = React.forwardRef<React.ElementRef<"button">, SubmitButtonProps>(({ disabled }, ref) => {
  return (
    <button
      ref={ref}
      type="submit"
      disabled={disabled}
      className="bg-white text-black rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {disabled ? <Loader className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
    </button>
  )
})
SubmitButton.displayName = "SubmitButton"

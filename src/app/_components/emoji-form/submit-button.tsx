import { CornerDownLeft } from "lucide-react"
import React from "react"
import { Loader } from "../loader"

export const SubmitButton = React.forwardRef<React.ElementRef<"button">>((_, ref) => {
  return (
    <button
      ref={ref}
      type="submit"
      className="bg-white text-black rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200"
    >
      <CornerDownLeft className="w-4 h-4" />
    </button>
  )
})
SubmitButton.displayName = "SubmitButton"

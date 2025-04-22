"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signOutAction() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error signing out:", error)
    // Optionally: return an error object or throw the error
    // depending on how you want to handle it client-side
    return { error: error.message }
  }

  // Option 1: Revalidate the current path or specific paths
  // Useful if you want the user to stay on the same page but see the logged-out state
  // revalidatePath("/") 
  // revalidatePath("/some-protected-route")

  // Option 2: Redirect to the home page (or login page)
  // Often the preferred behavior after logout
  redirect("/")
} 
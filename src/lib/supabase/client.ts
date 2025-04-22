import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Log the env vars being used by the browser client
  console.log("[Supabase Client] Initializing with:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Exists' : 'MISSING!',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Exists' : 'MISSING!',
  });

  // Log the raw cookie string available to the browser
  console.log("[Supabase Client] Document Cookie String:", typeof document !== 'undefined' ? document.cookie : 'document undefined');

  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 
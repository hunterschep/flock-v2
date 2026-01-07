import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid creating multiple clients
let supabaseInstance: SupabaseClient | null = null

/**
 * Get the browser Supabase client (singleton pattern)
 * Creates one instance and reuses it across the app
 */
export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
}


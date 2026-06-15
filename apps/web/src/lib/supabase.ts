import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Create client only if configured — avoids crashes with empty URLs
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient)

// Synchronous accessor for the current access token (used by GraphQL client)
let currentAccessToken: string | null = null

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    currentAccessToken = session?.access_token ?? null
  })

  // Initialize from existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentAccessToken = session?.access_token ?? null
  })
}

export function getAccessToken(): string | null {
  return currentAccessToken
}

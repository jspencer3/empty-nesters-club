import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Create client only if configured — avoids crashes with empty URLs
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient)

// Token cache — updated by both the auth state listener and manual session fetch.
// This provides a synchronous accessor for the GraphQL client's fetchOptions.
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

/**
 * Synchronous accessor for the current access token.
 * Used by the GraphQL client to attach the Authorization header.
 */
export function getAccessToken(): string | null {
  return currentAccessToken
}

/**
 * Explicitly set the access token (called by AuthProvider once session is confirmed).
 * This eliminates the race between token initialization and GraphQL queries.
 */
export function setAccessToken(token: string | null): void {
  currentAccessToken = token
}

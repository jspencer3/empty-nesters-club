import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, setAccessToken } from './supabase'
import { graphqlClient } from './graphql-client'

const ENSURE_USER_MUTATION = `
  mutation EnsureUser {
    ensureUser {
      id
      email
      displayName
    }
  }
`

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

async function ensureUserInDb() {
  try {
    await graphqlClient.mutation(ENSURE_USER_MUTATION, {}).toPromise()
  } catch (err) {
    console.error('[auth] Failed to ensure user record:', err)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Set token BEFORE flipping loading — ensures GraphQL queries have auth
      setAccessToken(session?.access_token ?? null)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session) {
        ensureUserInDb()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAccessToken(session?.access_token ?? null)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // Ensure user record exists on sign-in or token refresh
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        ensureUserInDb()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        ),
      }
    }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        ),
      }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        ),
      }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        ),
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error ? new Error(error.message) : null }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

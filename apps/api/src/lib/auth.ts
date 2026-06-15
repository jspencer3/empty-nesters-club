import { jwtVerify, createRemoteJWKSet } from 'jose'

export interface AuthUser {
  id: string
  email: string
  role: string
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''

// Use JWKS endpoint for token verification (supports ES256 asymmetric keys)
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
    })

    return {
      id: payload.sub ?? '',
      email: (payload.email as string) ?? '',
      role: (payload.role as string) ?? 'authenticated',
    }
  } catch (err) {
    console.error('[auth] JWT verification failed:', (err as Error).message)
    return null
  }
}

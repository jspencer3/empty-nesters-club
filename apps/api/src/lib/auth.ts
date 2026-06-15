import { jwtVerify } from 'jose'

export interface AuthUser {
  id: string
  email: string
  role: string
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? ''

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: `${SUPABASE_URL}/auth/v1`,
    })

    return {
      id: payload.sub ?? '',
      email: (payload.email as string) ?? '',
      role: (payload.role as string) ?? 'authenticated',
    }
  } catch {
    return null
  }
}

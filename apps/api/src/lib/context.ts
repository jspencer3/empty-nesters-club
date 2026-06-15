import type { YogaInitialContext } from 'graphql-yoga'
import { verifyToken, type AuthUser } from './auth.js'

export interface GraphQLContext {
  currentUser: AuthUser | null
}

export async function createContext(ctx: YogaInitialContext): Promise<GraphQLContext> {
  const authHeader = ctx.request.headers.get('authorization')
  let currentUser: AuthUser | null = null

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    currentUser = await verifyToken(token)
    if (!currentUser) {
      console.warn(
        '[context] Token provided but verification failed. Token prefix:',
        token.slice(0, 20) + '...',
      )
    }
  } else {
    console.warn('[context] No Authorization header on request')
  }

  return { currentUser }
}

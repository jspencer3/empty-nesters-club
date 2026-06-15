import SchemaBuilder from '@pothos/core'
import ScopeAuthPlugin from '@pothos/plugin-scope-auth'
import type { GraphQLContext } from '../lib/context.js'

export const builder = new SchemaBuilder<{
  Context: GraphQLContext
  AuthScopes: {
    authenticated: boolean
    admin: boolean
  }
}>({
  plugins: [ScopeAuthPlugin],
  scopeAuth: {
    authScopes: async (context) => ({
      authenticated: context.currentUser !== null,
      admin: context.currentUser?.role === 'service_role',
    }),
  },
})

import { Client, fetchExchange } from '@urql/core'
import { getAccessToken } from './supabase'

export const graphqlClient = new Client({
  url: '/graphql',
  exchanges: [fetchExchange],
  fetchOptions: () => {
    const token = getAccessToken()
    return {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  },
})

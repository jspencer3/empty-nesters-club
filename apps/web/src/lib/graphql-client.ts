import { Client, cacheExchange, fetchExchange } from '@urql/core'
import { getAccessToken } from './supabase'

export const graphqlClient = new Client({
  url: '/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getAccessToken()
    // Debug: remove after confirming auth works
    if (!token) {
      console.warn('[graphql-client] No access token available for request')
    }
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  },
})

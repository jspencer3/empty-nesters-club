import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './lib/auth-context'
import { GraphQLProvider } from './lib/urql-provider'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <GraphQLProvider>
        <App />
      </GraphQLProvider>
    </AuthProvider>
  </StrictMode>,
)

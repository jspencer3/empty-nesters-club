import 'dotenv/config'
import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { schema } from './schema/index.js'
import { createContext } from './lib/context.js'
import { handleSupabaseAuthWebhook } from './webhooks/supabase-auth.js'

const yoga = createYoga({
  schema,
  context: createContext,
})

const server = createServer((req, res) => {
  // Route webhook endpoints before GraphQL
  if (req.url === '/webhooks/supabase-auth') {
    handleSupabaseAuthWebhook(req, res)
    return
  }

  // Everything else goes to GraphQL Yoga
  yoga(req, res)
})

const port = parseInt(process.env.PORT ?? '4000', 10)

server.listen(port, () => {
  console.log(`GraphQL API running at http://localhost:${port}/graphql`)
  console.log(`Webhooks listening at http://localhost:${port}/webhooks/supabase-auth`)
})

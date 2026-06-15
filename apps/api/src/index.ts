import 'dotenv/config'
import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { schema } from './schema/index.js'
import { createContext } from './lib/context.js'

const yoga = createYoga({
  schema,
  context: createContext,
})

const server = createServer(yoga)

const port = parseInt(process.env.PORT ?? '4000', 10)

server.listen(port, () => {
  console.log(`GraphQL API running at http://localhost:${port}/graphql`)
})

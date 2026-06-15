import { Provider } from 'urql'
import { graphqlClient } from './graphql-client'

export function GraphQLProvider({ children }: { children: React.ReactNode }) {
  return <Provider value={graphqlClient}>{children}</Provider>
}

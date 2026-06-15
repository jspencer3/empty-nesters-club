import { builder } from '../builder.js'

builder.queryType({
  fields: (t) => ({
    health: t.string({
      resolve: () => 'ok',
    }),
  }),
})

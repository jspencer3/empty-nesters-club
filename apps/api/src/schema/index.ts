import { builder } from './builder.js'
import './types/query.js'
import './types/mutation.js'
import './types/user.js'
import './types/partner-group.js'
import './types/upload.js'

export const schema = builder.toSchema()

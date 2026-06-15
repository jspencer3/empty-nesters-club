import { builder } from '../builder.js'
import { prisma } from '@enc/db'
import { createPresignedUpload } from '../../lib/s3.js'

const PresignedUploadResult = builder.objectRef<{
  url: string
  key: string
  publicUrl: string
}>('PresignedUploadResult')

builder.objectType(PresignedUploadResult, {
  fields: (t) => ({
    url: t.exposeString('url'),
    key: t.exposeString('key'),
    publicUrl: t.exposeString('publicUrl'),
  }),
})

// Mutation: get presigned URL for avatar upload
builder.mutationField('requestAvatarUpload', (t) =>
  t.field({
    type: PresignedUploadResult,
    authScopes: { authenticated: true },
    args: {
      contentType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowed.includes(args.contentType)) {
        throw new Error(`Unsupported content type: ${args.contentType}`)
      }

      return createPresignedUpload('avatars', args.contentType, ctx.currentUser!.id)
    },
  }),
)

// Mutation: confirm avatar upload (update user record)
builder.mutationField('confirmAvatarUpload', (t) =>
  t.field({
    type: 'String',
    authScopes: { authenticated: true },
    args: {
      publicUrl: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await prisma.user.update({
        where: { supabaseId: ctx.currentUser!.id },
        data: { avatarUrl: args.publicUrl },
      })
      return args.publicUrl
    },
  }),
)

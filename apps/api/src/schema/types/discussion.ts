import { builder } from '../builder.js'
import { prisma } from '@enc/db'
import { User } from './user.js'

// --- Helper: resolve current user from context ---

async function resolveUser(supabaseId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId } })
  if (!user) throw new Error('User not found')
  return user
}

// --- Object Types ---

const ReactionRef = builder.objectRef<{
  id: string
  commentId: string
  userId: string
  emoji: string
  createdAt: Date
}>('Reaction')

builder.objectType(ReactionRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    emoji: t.exposeString('emoji'),
    createdAt: t.string({ resolve: (r) => r.createdAt.toISOString() }),
    user: t.field({
      type: User,
      nullable: true,
      resolve: async (reaction) => {
        return prisma.user.findUnique({ where: { id: reaction.userId } })
      },
    }),
  }),
})

const CommentRef = builder.objectRef<{
  id: string
  discussionId: string
  authorId: string
  parentCommentId: string | null
  body: string
  createdAt: Date
  updatedAt: Date
}>('Comment')

builder.objectType(CommentRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    body: t.exposeString('body'),
    parentCommentId: t.exposeString('parentCommentId', { nullable: true }),
    createdAt: t.string({ resolve: (c) => c.createdAt.toISOString() }),
    updatedAt: t.string({ resolve: (c) => c.updatedAt.toISOString() }),
    author: t.field({
      type: User,
      nullable: true,
      resolve: async (comment) => {
        return prisma.user.findUnique({ where: { id: comment.authorId } })
      },
    }),
    replies: t.field({
      type: [CommentRef],
      resolve: async (comment) => {
        return prisma.comment.findMany({
          where: { parentCommentId: comment.id },
          orderBy: { createdAt: 'asc' },
        })
      },
    }),
    reactions: t.field({
      type: [ReactionRef],
      resolve: async (comment) => {
        return prisma.reaction.findMany({ where: { commentId: comment.id } })
      },
    }),
    reactionCount: t.int({
      resolve: async (comment) => {
        return prisma.reaction.count({ where: { commentId: comment.id } })
      },
    }),
  }),
})

const DiscussionRef = builder.objectRef<{
  id: string
  activityInstanceId: string
  createdAt: Date
}>('Discussion')

builder.objectType(DiscussionRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    activityInstanceId: t.exposeString('activityInstanceId'),
    createdAt: t.string({ resolve: (d) => d.createdAt.toISOString() }),
    comments: t.field({
      type: [CommentRef],
      resolve: async (discussion) => {
        return prisma.comment.findMany({
          where: { discussionId: discussion.id, parentCommentId: null },
          orderBy: { createdAt: 'asc' },
        })
      },
    }),
    commentCount: t.int({
      resolve: async (discussion) => {
        return prisma.comment.count({ where: { discussionId: discussion.id } })
      },
    }),
  }),
})

// --- Queries ---

builder.queryField('discussion', (t) =>
  t.field({
    type: DiscussionRef,
    authScopes: { authenticated: true },
    args: {
      activityInstanceId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await resolveUser(ctx.currentUser!.id)

      // Auto-create discussion if it doesn't exist
      let discussion = await prisma.discussion.findUnique({
        where: { activityInstanceId: args.activityInstanceId },
      })

      if (!discussion) {
        discussion = await prisma.discussion.create({
          data: { activityInstanceId: args.activityInstanceId },
        })
      }

      return discussion
    },
  }),
)

// --- Mutations ---

const AddCommentInput = builder.inputType('AddCommentInput', {
  fields: (t) => ({
    discussionId: t.string({ required: true }),
    body: t.string({ required: true }),
    parentCommentId: t.string(),
  }),
})

builder.mutationField('addComment', (t) =>
  t.field({
    type: CommentRef,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: AddCommentInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Verify discussion exists
      const discussion = await prisma.discussion.findUnique({
        where: { id: args.input.discussionId },
      })
      if (!discussion) throw new Error('Discussion not found')

      // Validate parentCommentId if provided
      if (args.input.parentCommentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: args.input.parentCommentId },
        })
        if (!parentComment) throw new Error('Parent comment not found')
        if (parentComment.discussionId !== args.input.discussionId) {
          throw new Error('Parent comment does not belong to this discussion')
        }
        if (parentComment.parentCommentId !== null) {
          throw new Error('Cannot reply to a reply. Only one level of nesting is allowed.')
        }
      }

      return prisma.comment.create({
        data: {
          discussionId: args.input.discussionId,
          authorId: user.id,
          body: args.input.body,
          parentCommentId: args.input.parentCommentId ?? undefined,
        },
      })
    },
  }),
)

builder.mutationField('updateComment', (t) =>
  t.field({
    type: CommentRef,
    authScopes: { authenticated: true },
    args: {
      commentId: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const comment = await prisma.comment.findUnique({
        where: { id: args.commentId },
      })
      if (!comment) throw new Error('Comment not found')
      if (comment.authorId !== user.id) {
        throw new Error('Only the author can update this comment')
      }

      return prisma.comment.update({
        where: { id: args.commentId },
        data: { body: args.body },
      })
    },
  }),
)

builder.mutationField('deleteComment', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      commentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const comment = await prisma.comment.findUnique({
        where: { id: args.commentId },
      })
      if (!comment) throw new Error('Comment not found')
      if (comment.authorId !== user.id) {
        throw new Error('Only the author can delete this comment')
      }

      await prisma.comment.delete({ where: { id: args.commentId } })
      return true
    },
  }),
)

builder.mutationField('addReaction', (t) =>
  t.field({
    type: CommentRef,
    authScopes: { authenticated: true },
    args: {
      commentId: t.arg.string({ required: true }),
      emoji: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const comment = await prisma.comment.findUnique({
        where: { id: args.commentId },
      })
      if (!comment) throw new Error('Comment not found')

      // Toggle behavior: if same user+comment+emoji exists, remove it
      const existing = await prisma.reaction.findUnique({
        where: {
          commentId_userId_emoji: {
            commentId: args.commentId,
            userId: user.id,
            emoji: args.emoji,
          },
        },
      })

      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } })
      } else {
        await prisma.reaction.create({
          data: {
            commentId: args.commentId,
            userId: user.id,
            emoji: args.emoji,
          },
        })
      }

      return comment
    },
  }),
)

builder.mutationField('removeReaction', (t) =>
  t.field({
    type: CommentRef,
    authScopes: { authenticated: true },
    args: {
      commentId: t.arg.string({ required: true }),
      emoji: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const comment = await prisma.comment.findUnique({
        where: { id: args.commentId },
      })
      if (!comment) throw new Error('Comment not found')

      const existing = await prisma.reaction.findUnique({
        where: {
          commentId_userId_emoji: {
            commentId: args.commentId,
            userId: user.id,
            emoji: args.emoji,
          },
        },
      })

      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } })
      }

      return comment
    },
  }),
)

export { DiscussionRef }

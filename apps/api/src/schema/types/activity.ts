import { builder } from '../builder.js'
import { prisma } from '@enc/db'
import { User } from './user.js'

// --- Enums ---

const ActivityStatusEnum = builder.enumType('ActivityStatus', {
  values: ['PENDING', 'APPROVED', 'REJECTED'] as const,
})

const DifficultyEnum = builder.enumType('Difficulty', {
  values: ['EASY', 'MODERATE', 'CHALLENGING', 'EXTREME'] as const,
})

const InstanceStatusEnum = builder.enumType('InstanceStatus', {
  values: ['PLANNED', 'IN_PROGRESS', 'DONE', 'ABANDONED'] as const,
})

// --- Object Types ---

const Activity = builder.objectRef<{
  id: string
  title: string
  description: string
  category: string
  imageUrl: string | null
  difficulty: string
  estimatedDuration: string | null
  status: string
  submittedById: string | null
  createdAt: Date
  updatedAt: Date
}>('Activity')

builder.objectType(Activity, {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    category: t.exposeString('category'),
    imageUrl: t.exposeString('imageUrl', { nullable: true }),
    difficulty: t.exposeString('difficulty'),
    estimatedDuration: t.exposeString('estimatedDuration', { nullable: true }),
    status: t.exposeString('status'),
    submittedBy: t.field({
      type: User,
      nullable: true,
      resolve: async (activity) => {
        if (!activity.submittedById) return null
        return prisma.user.findUnique({ where: { id: activity.submittedById } })
      },
    }),
    createdAt: t.string({ resolve: (activity) => activity.createdAt.toISOString() }),
  }),
})

const RatingRef = builder.objectRef<{
  id: string
  activityInstanceId: string
  userId: string
  score: number
  comment: string | null
  createdAt: Date
}>('Rating')

builder.objectType(RatingRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    score: t.exposeInt('score'),
    comment: t.exposeString('comment', { nullable: true }),
    user: t.field({
      type: User,
      nullable: true,
      resolve: async (rating) => {
        return prisma.user.findUnique({ where: { id: rating.userId } })
      },
    }),
    createdAt: t.string({ resolve: (rating) => rating.createdAt.toISOString() }),
  }),
})

const ActivityInstanceRef = builder.objectRef<{
  id: string
  activityId: string
  nestId: string | null
  partnerGroupId: string | null
  status: string
  startedAt: Date | null
  completedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}>('ActivityInstance')

builder.objectType(ActivityInstanceRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    nestId: t.exposeString('nestId', { nullable: true }),
    partnerGroupId: t.exposeString('partnerGroupId', { nullable: true }),
    status: t.exposeString('status'),
    startedAt: t.string({
      nullable: true,
      resolve: (instance) => instance.startedAt?.toISOString() ?? null,
    }),
    completedAt: t.string({
      nullable: true,
      resolve: (instance) => instance.completedAt?.toISOString() ?? null,
    }),
    notes: t.exposeString('notes', { nullable: true }),
    activity: t.field({
      type: Activity,
      resolve: async (instance) => {
        const activity = await prisma.activity.findUnique({
          where: { id: instance.activityId },
        })
        if (!activity) throw new Error('Activity not found')
        return activity
      },
    }),
    ratings: t.field({
      type: [RatingRef],
      resolve: async (instance) => {
        return prisma.rating.findMany({
          where: { activityInstanceId: instance.id },
        })
      },
    }),
    averageRating: t.float({
      nullable: true,
      resolve: async (instance) => {
        const result = await prisma.rating.aggregate({
          where: { activityInstanceId: instance.id },
          _avg: { score: true },
        })
        return result._avg.score
      },
    }),
    createdAt: t.string({ resolve: (instance) => instance.createdAt.toISOString() }),
  }),
})

const BookmarkRef = builder.objectRef<{
  id: string
  userId: string
  activityId: string
  createdAt: Date
}>('Bookmark')

builder.objectType(BookmarkRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    activity: t.field({
      type: Activity,
      resolve: async (bookmark) => {
        const activity = await prisma.activity.findUnique({
          where: { id: bookmark.activityId },
        })
        if (!activity) throw new Error('Activity not found')
        return activity
      },
    }),
    createdAt: t.string({ resolve: (bookmark) => bookmark.createdAt.toISOString() }),
  }),
})

// --- Helper ---

async function resolveUser(supabaseId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId } })
  if (!user) throw new Error('User not found')
  return user
}

// --- Queries ---

builder.queryField('activities', (t) =>
  t.field({
    type: [Activity],
    authScopes: { authenticated: true },
    args: {
      category: t.arg.string(),
      search: t.arg.string(),
      status: t.arg({ type: ActivityStatusEnum }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Default to APPROVED for non-admin; admin can filter by any status
      const isAdmin = user.role === 'SITE_ADMIN'
      const statusFilter = args.status ?? (isAdmin ? undefined : 'APPROVED')

      const where: Record<string, unknown> = {}
      if (statusFilter) {
        where.status = statusFilter
      }
      if (args.category) {
        where.category = args.category
      }
      if (args.search) {
        where.OR = [
          { title: { contains: args.search, mode: 'insensitive' } },
          { description: { contains: args.search, mode: 'insensitive' } },
        ]
      }

      return prisma.activity.findMany({ where })
    },
  }),
)

builder.queryField('activity', (t) =>
  t.field({
    type: Activity,
    nullable: true,
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      return prisma.activity.findUnique({ where: { id: args.id } })
    },
  }),
)

builder.queryField('myBookmarks', (t) =>
  t.field({
    type: [BookmarkRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.bookmark.findMany({ where: { userId: user.id } })
    },
  }),
)

builder.queryField('myActivityInstances', (t) =>
  t.field({
    type: [ActivityInstanceRef],
    authScopes: { authenticated: true },
    args: {
      status: t.arg({ type: InstanceStatusEnum }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Find nests and partner groups the user belongs to
      const nestMemberships = await prisma.nestMembership.findMany({
        where: { userId: user.id },
        select: { nestId: true },
      })
      const partnerGroupMemberships = await prisma.partnerGroupMember.findMany({
        where: { userId: user.id },
        select: { partnerGroupId: true },
      })

      const nestIds = nestMemberships.map((m) => m.nestId)
      const partnerGroupIds = partnerGroupMemberships.map((m) => m.partnerGroupId)

      const where: Record<string, unknown> = {
        OR: [{ nestId: { in: nestIds } }, { partnerGroupId: { in: partnerGroupIds } }],
      }
      if (args.status) {
        where.status = args.status
      }

      return prisma.activityInstance.findMany({ where })
    },
  }),
)

builder.queryField('activityInstance', (t) =>
  t.field({
    type: ActivityInstanceRef,
    nullable: true,
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      return prisma.activityInstance.findUnique({ where: { id: args.id } })
    },
  }),
)

// --- Mutations ---

const SubmitActivityInput = builder.inputType('SubmitActivityInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string({ required: true }),
    category: t.string({ required: true }),
    imageUrl: t.string(),
    difficulty: t.field({ type: DifficultyEnum }),
    estimatedDuration: t.string(),
  }),
})

builder.mutationField('submitActivity', (t) =>
  t.field({
    type: Activity,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: SubmitActivityInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      return prisma.activity.create({
        data: {
          title: args.input.title,
          description: args.input.description,
          category: args.input.category,
          imageUrl: args.input.imageUrl ?? undefined,
          difficulty: args.input.difficulty ?? 'MODERATE',
          estimatedDuration: args.input.estimatedDuration ?? undefined,
          status: 'PENDING',
          submittedById: user.id,
        },
      })
    },
  }),
)

builder.mutationField('bookmarkActivity', (t) =>
  t.field({
    type: Activity,
    authScopes: { authenticated: true },
    args: {
      activityId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const activity = await prisma.activity.findUnique({
        where: { id: args.activityId },
      })
      if (!activity) throw new Error('Activity not found')

      // Toggle: delete if exists, create if not
      const existing = await prisma.bookmark.findUnique({
        where: { userId_activityId: { userId: user.id, activityId: args.activityId } },
      })

      if (existing) {
        await prisma.bookmark.delete({
          where: { id: existing.id },
        })
      } else {
        await prisma.bookmark.create({
          data: { userId: user.id, activityId: args.activityId },
        })
      }

      return activity
    },
  }),
)

const CreateActivityInstanceInput = builder.inputType('CreateActivityInstanceInput', {
  fields: (t) => ({
    activityId: t.string({ required: true }),
    nestId: t.string(),
    partnerGroupId: t.string(),
  }),
})

builder.mutationField('createActivityInstance', (t) =>
  t.field({
    type: ActivityInstanceRef,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: CreateActivityInstanceInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      if (!args.input.nestId && !args.input.partnerGroupId) {
        throw new Error('Must provide either nestId or partnerGroupId')
      }
      if (args.input.nestId && args.input.partnerGroupId) {
        throw new Error('Provide only one of nestId or partnerGroupId')
      }

      // Verify activity exists
      const activity = await prisma.activity.findUnique({
        where: { id: args.input.activityId },
      })
      if (!activity) throw new Error('Activity not found')

      // Verify membership
      if (args.input.nestId) {
        const membership = await prisma.nestMembership.findUnique({
          where: { nestId_userId: { nestId: args.input.nestId, userId: user.id } },
        })
        if (!membership) throw new Error('You are not a member of this nest')
      }
      if (args.input.partnerGroupId) {
        const membership = await prisma.partnerGroupMember.findUnique({
          where: {
            userId_partnerGroupId: {
              userId: user.id,
              partnerGroupId: args.input.partnerGroupId,
            },
          },
        })
        if (!membership) throw new Error('You are not a member of this partner group')
      }

      return prisma.activityInstance.create({
        data: {
          activityId: args.input.activityId,
          nestId: args.input.nestId ?? undefined,
          partnerGroupId: args.input.partnerGroupId ?? undefined,
          status: 'PLANNED',
        },
      })
    },
  }),
)

builder.mutationField('updateInstanceStatus', (t) =>
  t.field({
    type: ActivityInstanceRef,
    authScopes: { authenticated: true },
    args: {
      instanceId: t.arg.string({ required: true }),
      status: t.arg({ type: InstanceStatusEnum, required: true }),
    },
    resolve: async (_root, args) => {
      const instance = await prisma.activityInstance.findUnique({
        where: { id: args.instanceId },
      })
      if (!instance) throw new Error('Activity instance not found')

      // Validate transitions
      const currentStatus = instance.status
      const newStatus = args.status

      const validTransitions: Record<string, string[]> = {
        PLANNED: ['IN_PROGRESS'],
        IN_PROGRESS: ['DONE', 'ABANDONED'],
      }

      const allowed = validTransitions[currentStatus]
      if (!allowed || !allowed.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
      }

      const data: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'IN_PROGRESS') {
        data.startedAt = new Date()
      }
      if (newStatus === 'DONE' || newStatus === 'ABANDONED') {
        data.completedAt = new Date()
      }

      return prisma.activityInstance.update({
        where: { id: args.instanceId },
        data,
      })
    },
  }),
)

builder.mutationField('rateActivityInstance', (t) =>
  t.field({
    type: RatingRef,
    authScopes: { authenticated: true },
    args: {
      instanceId: t.arg.string({ required: true }),
      score: t.arg.int({ required: true }),
      comment: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      if (args.score < 1 || args.score > 5) {
        throw new Error('Score must be between 1 and 5')
      }

      const instance = await prisma.activityInstance.findUnique({
        where: { id: args.instanceId },
      })
      if (!instance) throw new Error('Activity instance not found')

      if (instance.status !== 'DONE' && instance.status !== 'ABANDONED') {
        throw new Error('Can only rate completed or abandoned instances')
      }

      // Upsert: one rating per user per instance
      return prisma.rating.upsert({
        where: {
          activityInstanceId_userId: {
            activityInstanceId: args.instanceId,
            userId: user.id,
          },
        },
        create: {
          activityInstanceId: args.instanceId,
          userId: user.id,
          score: args.score,
          comment: args.comment ?? undefined,
        },
        update: {
          score: args.score,
          comment: args.comment ?? undefined,
        },
      })
    },
  }),
)

export { Activity }

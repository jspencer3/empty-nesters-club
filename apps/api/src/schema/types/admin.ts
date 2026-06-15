import { builder } from '../builder.js'
import { prisma } from '@enc/db'

// --- Helper ---

async function requireSiteAdmin(ctx: { currentUser: { id: string } | null }) {
  if (!ctx.currentUser) throw new Error('Not authenticated')
  const user = await prisma.user.findUnique({
    where: { supabaseId: ctx.currentUser.id },
  })
  if (!user) throw new Error('User not found')
  if (user.role !== 'SITE_ADMIN') throw new Error('Forbidden: requires SITE_ADMIN role')
  return user
}

// --- Object Types ---

const SystemStats = builder.objectRef<{
  totalUsers: number
  totalNests: number
  totalActivities: number
  totalActiveInstances: number
  totalPendingActivities: number
  totalPendingTestimonials: number
}>('SystemStats')

builder.objectType(SystemStats, {
  fields: (t) => ({
    totalUsers: t.exposeInt('totalUsers'),
    totalNests: t.exposeInt('totalNests'),
    totalActivities: t.exposeInt('totalActivities'),
    totalActiveInstances: t.exposeInt('totalActiveInstances'),
    totalPendingActivities: t.exposeInt('totalPendingActivities'),
    totalPendingTestimonials: t.exposeInt('totalPendingTestimonials'),
  }),
})

// --- Queries ---

builder.queryField('pendingActivities', (t) =>
  t.field({
    type: ['String'],
    authScopes: { authenticated: true },
    args: {
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      const activities = await prisma.activity.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
      })

      return activities.map((a) => JSON.stringify(a))
    },
  }),
)

builder.queryField('pendingTestimonials', (t) =>
  t.field({
    type: ['String'],
    authScopes: { authenticated: true },
    args: {
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      const testimonials = await prisma.testimonial.findMany({
        where: {
          approvalStatus: 'PENDING',
          visibility: { in: ['PUBLIC', 'NEST_PRIVATE'] },
        },
        orderBy: { createdAt: 'asc' },
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
      })

      return testimonials.map((t) => JSON.stringify(t))
    },
  }),
)

builder.queryField('adminUserList', (t) =>
  t.field({
    type: ['String'],
    authScopes: { authenticated: true },
    args: {
      search: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      const where: Record<string, unknown> = {}
      if (args.search) {
        where.OR = [
          { displayName: { contains: args.search, mode: 'insensitive' } },
          { email: { contains: args.search, mode: 'insensitive' } },
        ]
      }

      const users = await prisma.user.findMany({
        where,
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
      })

      return users.map((u) => JSON.stringify(u))
    },
  }),
)

builder.queryField('adminSystemStats', (t) =>
  t.field({
    type: SystemStats,
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      await requireSiteAdmin(ctx)

      const [
        totalUsers,
        totalNests,
        totalActivities,
        totalActiveInstances,
        totalPendingActivities,
        totalPendingTestimonials,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.nest.count(),
        prisma.activity.count(),
        prisma.activityInstance.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.activity.count({ where: { status: 'PENDING' } }),
        prisma.testimonial.count({ where: { approvalStatus: 'PENDING' } }),
      ])

      return {
        totalUsers,
        totalNests,
        totalActivities,
        totalActiveInstances,
        totalPendingActivities,
        totalPendingTestimonials,
      }
    },
  }),
)

// --- Mutations ---

builder.mutationField('approveActivity', (t) =>
  t.field({
    type: 'String',
    authScopes: { authenticated: true },
    args: {
      activityId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const admin = await requireSiteAdmin(ctx)

      const activity = await prisma.activity.update({
        where: { id: args.activityId },
        data: {
          status: 'APPROVED',
          approvedById: admin.id,
        },
      })

      return JSON.stringify(activity)
    },
  }),
)

builder.mutationField('rejectActivity', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      activityId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      await prisma.activity.update({
        where: { id: args.activityId },
        data: { status: 'REJECTED' },
      })

      return true
    },
  }),
)

builder.mutationField('approveTestimonial', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      testimonialId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const admin = await requireSiteAdmin(ctx)

      await prisma.testimonial.update({
        where: { id: args.testimonialId },
        data: {
          approvalStatus: 'APPROVED',
          approvedById: admin.id,
        },
      })

      return true
    },
  }),
)

builder.mutationField('rejectTestimonial', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      testimonialId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      await prisma.testimonial.update({
        where: { id: args.testimonialId },
        data: { approvalStatus: 'REJECTED' },
      })

      return true
    },
  }),
)

builder.mutationField('suspendUser', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      // TODO: Add a `suspended` field to the User model for proper suspension.
      // Supabase manages sessions externally — would need Supabase Admin API to revoke.
      // For now, this is a placeholder that marks intent.
      console.log(`[ADMIN] Suspend requested for user: ${args.userId}`)

      return true
    },
  }),
)

builder.mutationField('promoteToAdmin', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      await prisma.user.update({
        where: { id: args.userId },
        data: { role: 'SITE_ADMIN' },
      })

      return true
    },
  }),
)

builder.mutationField('demoteFromAdmin', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await requireSiteAdmin(ctx)

      await prisma.user.update({
        where: { id: args.userId },
        data: { role: 'MEMBER' },
      })

      return true
    },
  }),
)

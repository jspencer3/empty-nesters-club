import { builder } from '../builder.js'
import { prisma } from '@enc/db'

// --- Helper: resolve current user from context ---

async function resolveUser(supabaseId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId } })
  if (!user) throw new Error('User not found')
  return user
}

// --- Inline type for activity instances in dashboard context ---

const DashboardActivityInstance = builder.objectRef<{
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
}>('DashboardActivityInstance')

builder.objectType(DashboardActivityInstance, {
  fields: (t) => ({
    id: t.exposeID('id'),
    activityId: t.exposeString('activityId'),
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
    title: t.string({
      resolve: async (instance) => {
        const activity = await prisma.activity.findUnique({
          where: { id: instance.activityId },
        })
        return activity?.title ?? 'Unknown Activity'
      },
    }),
    createdAt: t.string({ resolve: (instance) => instance.createdAt.toISOString() }),
  }),
})

// --- Object Types ---

const ActivityWithRating = builder.objectRef<{
  activityId: string
  title: string
  averageRating: number
  completionCount: number
}>('ActivityWithRating')

builder.objectType(ActivityWithRating, {
  fields: (t) => ({
    activityId: t.exposeString('activityId'),
    title: t.exposeString('title'),
    averageRating: t.exposeFloat('averageRating'),
    completionCount: t.exposeInt('completionCount'),
  }),
})

const UserDashboard = builder.objectRef<{
  totalActivitiesCompleted: number
  totalActivitiesInProgress: number
  totalActivitiesPlanned: number
  bookmarkCount: number
  nestCount: number
  recentActivity: Array<{
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
  }>
  averageRating: number | null
}>('UserDashboard')

builder.objectType(UserDashboard, {
  fields: (t) => ({
    totalActivitiesCompleted: t.exposeInt('totalActivitiesCompleted'),
    totalActivitiesInProgress: t.exposeInt('totalActivitiesInProgress'),
    totalActivitiesPlanned: t.exposeInt('totalActivitiesPlanned'),
    bookmarkCount: t.exposeInt('bookmarkCount'),
    nestCount: t.exposeInt('nestCount'),
    recentActivity: t.field({
      type: [DashboardActivityInstance],
      resolve: (dashboard) => dashboard.recentActivity,
    }),
    averageRating: t.exposeFloat('averageRating', { nullable: true }),
  }),
})

const NestDashboard = builder.objectRef<{
  nestId: string
  nestName: string
  memberCount: number
  totalActivitiesCompleted: number
  totalActivitiesInProgress: number
  recentActivity: Array<{
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
  }>
  topRatedActivities: Array<{
    activityId: string
    title: string
    averageRating: number
    completionCount: number
  }>
  activeDiscussionCount: number
}>('NestDashboard')

builder.objectType(NestDashboard, {
  fields: (t) => ({
    nestId: t.exposeString('nestId'),
    nestName: t.exposeString('nestName'),
    memberCount: t.exposeInt('memberCount'),
    totalActivitiesCompleted: t.exposeInt('totalActivitiesCompleted'),
    totalActivitiesInProgress: t.exposeInt('totalActivitiesInProgress'),
    recentActivity: t.field({
      type: [DashboardActivityInstance],
      resolve: (dashboard) => dashboard.recentActivity,
    }),
    topRatedActivities: t.field({
      type: [ActivityWithRating],
      resolve: (dashboard) => dashboard.topRatedActivities,
    }),
    activeDiscussionCount: t.exposeInt('activeDiscussionCount'),
  }),
})

const PartnerGroupDashboard = builder.objectRef<{
  partnerGroupId: string
  groupName: string
  totalActivitiesCompleted: number
  totalActivitiesInProgress: number
  sharedNestCount: number
  recentActivity: Array<{
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
  }>
}>('PartnerGroupDashboard')

builder.objectType(PartnerGroupDashboard, {
  fields: (t) => ({
    partnerGroupId: t.exposeString('partnerGroupId'),
    groupName: t.exposeString('groupName'),
    totalActivitiesCompleted: t.exposeInt('totalActivitiesCompleted'),
    totalActivitiesInProgress: t.exposeInt('totalActivitiesInProgress'),
    sharedNestCount: t.exposeInt('sharedNestCount'),
    recentActivity: t.field({
      type: [DashboardActivityInstance],
      resolve: (dashboard) => dashboard.recentActivity,
    }),
  }),
})

// --- Queries ---

builder.queryField('userDashboard', (t) =>
  t.field({
    type: UserDashboard,
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
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

      const instanceWhere = {
        OR: [
          ...(nestIds.length > 0 ? [{ nestId: { in: nestIds } }] : []),
          ...(partnerGroupIds.length > 0 ? [{ partnerGroupId: { in: partnerGroupIds } }] : []),
        ],
      }

      // If user has no memberships, return empty dashboard
      if (nestIds.length === 0 && partnerGroupIds.length === 0) {
        const bookmarkCount = await prisma.bookmark.count({ where: { userId: user.id } })
        return {
          totalActivitiesCompleted: 0,
          totalActivitiesInProgress: 0,
          totalActivitiesPlanned: 0,
          bookmarkCount,
          nestCount: 0,
          recentActivity: [],
          averageRating: null,
        }
      }

      const [completed, inProgress, planned, bookmarkCount, recentActivity] = await Promise.all([
        prisma.activityInstance.count({ where: { ...instanceWhere, status: 'DONE' } }),
        prisma.activityInstance.count({ where: { ...instanceWhere, status: 'IN_PROGRESS' } }),
        prisma.activityInstance.count({ where: { ...instanceWhere, status: 'PLANNED' } }),
        prisma.bookmark.count({ where: { userId: user.id } }),
        prisma.activityInstance.findMany({
          where: instanceWhere,
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ])

      // Compute average rating from all ratings the user has given
      const ratingAgg = await prisma.rating.aggregate({
        where: { userId: user.id },
        _avg: { score: true },
      })

      return {
        totalActivitiesCompleted: completed,
        totalActivitiesInProgress: inProgress,
        totalActivitiesPlanned: planned,
        bookmarkCount,
        nestCount: nestIds.length,
        recentActivity,
        averageRating: ratingAgg._avg.score,
      }
    },
  }),
)

builder.queryField('nestDashboard', (t) =>
  t.field({
    type: NestDashboard,
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Verify membership
      const membership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
      })
      if (!membership) throw new Error('You are not a member of this nest')

      const nest = await prisma.nest.findUnique({ where: { id: args.nestId } })
      if (!nest) throw new Error('Nest not found')

      const instanceWhere = { nestId: args.nestId }

      const [memberCount, completed, inProgress, recentActivity, activeDiscussionCount] =
        await Promise.all([
          prisma.nestMembership.count({ where: { nestId: args.nestId } }),
          prisma.activityInstance.count({ where: { ...instanceWhere, status: 'DONE' } }),
          prisma.activityInstance.count({ where: { ...instanceWhere, status: 'IN_PROGRESS' } }),
          prisma.activityInstance.findMany({
            where: { ...instanceWhere, status: 'DONE' },
            orderBy: { completedAt: 'desc' },
            take: 5,
          }),
          prisma.discussion.count({
            where: {
              activityInstance: { nestId: args.nestId },
            },
          }),
        ])

      // Compute top-rated activities: fetch completed instances with ratings, compute in JS
      const completedInstances = await prisma.activityInstance.findMany({
        where: { nestId: args.nestId, status: 'DONE' },
        include: {
          activity: true,
          ratings: true,
        },
      })

      // Group by activity and compute average rating
      const activityRatings = new Map<
        string,
        { title: string; totalScore: number; ratingCount: number; completionCount: number }
      >()

      for (const instance of completedInstances) {
        const existing = activityRatings.get(instance.activityId)
        const instanceRatingSum = instance.ratings.reduce((sum, r) => sum + r.score, 0)
        const instanceRatingCount = instance.ratings.length

        if (existing) {
          existing.totalScore += instanceRatingSum
          existing.ratingCount += instanceRatingCount
          existing.completionCount += 1
        } else {
          activityRatings.set(instance.activityId, {
            title: instance.activity.title,
            totalScore: instanceRatingSum,
            ratingCount: instanceRatingCount,
            completionCount: 1,
          })
        }
      }

      const topRatedActivities = Array.from(activityRatings.entries())
        .filter(([, data]) => data.ratingCount > 0)
        .map(([activityId, data]) => ({
          activityId,
          title: data.title,
          averageRating: data.totalScore / data.ratingCount,
          completionCount: data.completionCount,
        }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5)

      return {
        nestId: nest.id,
        nestName: nest.name,
        memberCount,
        totalActivitiesCompleted: completed,
        totalActivitiesInProgress: inProgress,
        recentActivity,
        topRatedActivities,
        activeDiscussionCount,
      }
    },
  }),
)

builder.queryField('partnerGroupDashboard', (t) =>
  t.field({
    type: PartnerGroupDashboard,
    authScopes: { authenticated: true },
    args: {
      partnerGroupId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Verify membership
      const membership = await prisma.partnerGroupMember.findUnique({
        where: {
          userId_partnerGroupId: {
            userId: user.id,
            partnerGroupId: args.partnerGroupId,
          },
        },
      })
      if (!membership) throw new Error('You are not a member of this partner group')

      const group = await prisma.partnerGroup.findUnique({ where: { id: args.partnerGroupId } })
      if (!group) throw new Error('Partner group not found')

      const instanceWhere = { partnerGroupId: args.partnerGroupId }

      // Count shared nests: nests where any member of this partner group belongs
      const groupMembers = await prisma.partnerGroupMember.findMany({
        where: { partnerGroupId: args.partnerGroupId },
        select: { userId: true },
      })
      const memberUserIds = groupMembers.map((m) => m.userId)

      const [completed, inProgress, recentActivity, sharedNestCount] = await Promise.all([
        prisma.activityInstance.count({ where: { ...instanceWhere, status: 'DONE' } }),
        prisma.activityInstance.count({ where: { ...instanceWhere, status: 'IN_PROGRESS' } }),
        prisma.activityInstance.findMany({
          where: { ...instanceWhere, status: 'DONE' },
          orderBy: { completedAt: 'desc' },
          take: 5,
        }),
        prisma.nestMembership
          .groupBy({
            by: ['nestId'],
            where: { userId: { in: memberUserIds } },
          })
          .then((groups) => groups.length),
      ])

      return {
        partnerGroupId: group.id,
        groupName: group.name,
        totalActivitiesCompleted: completed,
        totalActivitiesInProgress: inProgress,
        sharedNestCount,
        recentActivity,
      }
    },
  }),
)

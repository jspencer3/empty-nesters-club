import { builder } from '../builder.js'
import { prisma, NotificationType } from '@enc/db'

// --- Enums ---

builder.enumType('NotificationType', {
  values: [
    'INVITE',
    'ACTIVITY_UPDATE',
    'MENTION',
    'REPLY',
    'VOTE',
    'ADMIN',
    'TESTIMONIAL',
  ] as const,
})

// --- Object Types ---

const NotificationRef = builder.objectRef<{
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  actionUrl: string | null
  read: boolean
  createdAt: Date
}>('Notification')

builder.objectType(NotificationRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    title: t.exposeString('title'),
    body: t.exposeString('body', { nullable: true }),
    actionUrl: t.exposeString('actionUrl', { nullable: true }),
    read: t.exposeBoolean('read'),
    createdAt: t.string({ resolve: (n) => n.createdAt.toISOString() }),
  }),
})

const NotificationPreferenceRef = builder.objectRef<{
  id: string
  userId: string
  eventType: string
  inAppEnabled: boolean
  emailEnabled: boolean
  pushEnabled: boolean
}>('NotificationPreference')

builder.objectType(NotificationPreferenceRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    eventType: t.exposeString('eventType'),
    inAppEnabled: t.exposeBoolean('inAppEnabled'),
    emailEnabled: t.exposeBoolean('emailEnabled'),
    pushEnabled: t.exposeBoolean('pushEnabled'),
  }),
})

// --- Helper ---

async function resolveUser(supabaseId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId } })
  if (!user) throw new Error('User not found')
  return user
}

// --- Queries ---

builder.queryField('myNotifications', (t) =>
  t.field({
    type: [NotificationRef],
    authScopes: { authenticated: true },
    args: {
      unreadOnly: t.arg.boolean(),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.notification.findMany({
        where: {
          userId: user.id,
          ...(args.unreadOnly && { read: false }),
        },
        orderBy: { createdAt: 'desc' },
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
      })
    },
  }),
)

builder.queryField('unreadNotificationCount', (t) =>
  t.field({
    type: 'Int',
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.notification.count({
        where: { userId: user.id, read: false },
      })
    },
  }),
)

builder.queryField('myNotificationPreferences', (t) =>
  t.field({
    type: [NotificationPreferenceRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const existing = await prisma.notificationPreference.findMany({
        where: { userId: user.id },
      })

      if (existing.length > 0) return existing

      // Create defaults for all event types
      const eventTypes: NotificationType[] = [
        'INVITE',
        'ACTIVITY_UPDATE',
        'MENTION',
        'REPLY',
        'VOTE',
        'ADMIN',
        'TESTIMONIAL',
      ]

      await prisma.notificationPreference.createMany({
        data: eventTypes.map((eventType) => ({
          userId: user.id,
          eventType,
          inAppEnabled: true,
          emailEnabled: true,
          pushEnabled: true,
        })),
      })

      return prisma.notificationPreference.findMany({
        where: { userId: user.id },
      })
    },
  }),
)

// --- Mutations ---

builder.mutationField('markNotificationRead', (t) =>
  t.field({
    type: NotificationRef,
    authScopes: { authenticated: true },
    args: {
      notificationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const notification = await prisma.notification.findUnique({
        where: { id: args.notificationId },
      })
      if (!notification) throw new Error('Notification not found')
      if (notification.userId !== user.id) throw new Error('Not your notification')

      return prisma.notification.update({
        where: { id: args.notificationId },
        data: { read: true },
      })
    },
  }),
)

builder.mutationField('markAllNotificationsRead', (t) =>
  t.field({
    type: 'Int',
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const result = await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      })

      return result.count
    },
  }),
)

const UpdateNotificationPreferenceInput = builder.inputType('UpdateNotificationPreferenceInput', {
  fields: (t) => ({
    eventType: t.string({ required: true }),
    inAppEnabled: t.boolean(),
    emailEnabled: t.boolean(),
    pushEnabled: t.boolean(),
  }),
})

builder.mutationField('updateNotificationPreference', (t) =>
  t.field({
    type: NotificationPreferenceRef,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: UpdateNotificationPreferenceInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      return prisma.notificationPreference.upsert({
        where: {
          userId_eventType: {
            userId: user.id,
            eventType: args.input.eventType as NotificationType,
          },
        },
        create: {
          userId: user.id,
          eventType: args.input.eventType as NotificationType,
          inAppEnabled: args.input.inAppEnabled ?? true,
          emailEnabled: args.input.emailEnabled ?? true,
          pushEnabled: args.input.pushEnabled ?? true,
        },
        update: {
          ...(args.input.inAppEnabled != null && { inAppEnabled: args.input.inAppEnabled }),
          ...(args.input.emailEnabled != null && { emailEnabled: args.input.emailEnabled }),
          ...(args.input.pushEnabled != null && { pushEnabled: args.input.pushEnabled }),
        },
      })
    },
  }),
)

export { NotificationRef, NotificationPreferenceRef }

import { prisma } from '@enc/db'
import type { NotificationType } from '@enc/db'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body?: string
  actionUrl?: string
}

export async function createNotification(input: CreateNotificationInput) {
  // Check user's preference for this notification type
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId_eventType: { userId: input.userId, eventType: input.type } },
  })

  // If user has disabled in-app for this type, skip
  if (preference && !preference.inAppEnabled) {
    return null
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
    },
  })
}

export async function createBulkNotifications(inputs: CreateNotificationInput[]) {
  // Filter based on preferences
  const results = await Promise.allSettled(inputs.map(createNotification))
  return results.filter((r) => r.status === 'fulfilled' && r.value !== null)
}

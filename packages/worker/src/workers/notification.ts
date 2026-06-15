import { Worker } from 'bullmq'
import { prisma } from '@enc/db'
import { connection } from '../connection.js'
import type { NotificationJobData } from '../queues.js'

export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job) => {
    const { userId, type, title, body, actionUrl } = job.data

    // Check user preferences
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_eventType: {
          userId,
          eventType: type as any,
        },
      },
    })

    if (preference && !preference.inAppEnabled) {
      return { skipped: true, reason: 'user_disabled' }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        body,
        actionUrl,
      },
    })

    // TODO: Emit WebSocket event for real-time delivery

    return { notificationId: notification.id }
  },
  { connection },
)

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message)
})

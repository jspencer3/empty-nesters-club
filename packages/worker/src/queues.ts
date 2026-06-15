import { Queue } from 'bullmq'
import { connection } from './connection.js'

export const notificationQueue = new Queue('notifications', { connection })
export const emailQueue = new Queue('emails', { connection })
export const scheduledQueue = new Queue('scheduled', { connection })

export type NotificationJobData = {
  userId: string
  type: string
  title: string
  body?: string
  actionUrl?: string
}

export type EmailJobData = {
  to: string
  subject: string
  html: string
  text?: string
}

export type ScheduledJobData = {
  task: 'admin-idle-check' | 'notification-digest'
}

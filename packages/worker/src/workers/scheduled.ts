import { Worker } from 'bullmq'
import { prisma } from '@enc/db'
import { connection } from '../connection.js'
import type { ScheduledJobData } from '../queues.js'

export const scheduledWorker = new Worker<ScheduledJobData>(
  'scheduled',
  async (job) => {
    switch (job.data.task) {
      case 'admin-idle-check':
        return await checkIdleAdmins()
      case 'notification-digest':
        // TODO: Implement digest emails
        return { task: 'notification-digest', status: 'not_implemented' }
      default:
        throw new Error(`Unknown scheduled task: ${job.data.task}`)
    }
  },
  { connection },
)

async function checkIdleAdmins() {
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - 30) // Default 30 days

  const idleAdmins = await prisma.nestMembership.findMany({
    where: {
      role: 'ADMIN',
      lastActiveAt: { lt: thresholdDate },
    },
    include: {
      nest: true,
      user: true,
    },
  })

  // TODO: Trigger admin succession nomination for each idle admin
  console.log(`Found ${idleAdmins.length} idle admins`)

  return { idleAdminCount: idleAdmins.length }
}

scheduledWorker.on('failed', (job, err) => {
  console.error(`Scheduled job ${job?.id} failed:`, err.message)
})

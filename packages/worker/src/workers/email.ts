import { Worker } from 'bullmq'
import { connection } from '../connection.js'
import type { EmailJobData } from '../queues.js'

export const emailWorker = new Worker<EmailJobData>(
  'emails',
  async (job) => {
    const { to, subject, html: _html } = job.data

    // TODO: Integrate with email service (Resend/SES)
    console.log(`[EMAIL] Would send to ${to}: ${subject}`)

    return { sent: true, to, subject }
  },
  { connection },
)

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message)
})

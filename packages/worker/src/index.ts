import 'dotenv/config'
import { notificationWorker } from './workers/notification.js'
import { emailWorker } from './workers/email.js'
import { scheduledWorker } from './workers/scheduled.js'

console.log('Starting workers...')

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down workers...')
  await Promise.all([notificationWorker.close(), emailWorker.close(), scheduledWorker.close()])
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log('Workers running:')
console.log('  - notification')
console.log('  - email')
console.log('  - scheduled')

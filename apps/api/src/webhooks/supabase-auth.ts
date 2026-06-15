import type { IncomingMessage, ServerResponse } from 'node:http'
import { prisma } from '@enc/db'

/**
 * Handles Supabase Auth webhook events.
 * Supabase sends a POST with a JSON body containing the user record
 * when events like user.created occur.
 *
 * Expected payload shape (Supabase Auth webhook):
 * {
 *   type: "INSERT",
 *   table: "users",
 *   schema: "auth",
 *   record: {
 *     id: "uuid",
 *     email: "user@example.com",
 *     raw_user_meta_data: { display_name?: string },
 *     ...
 *   },
 *   old_record: null
 * }
 */

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET ?? ''

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

export async function handleSupabaseAuthWebhook(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Only accept POST
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Verify webhook secret (simple shared-secret auth)
  const authHeader = req.headers['authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (WEBHOOK_SECRET && token !== WEBHOOK_SECRET) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  try {
    const rawBody = await parseBody(req)
    const payload = JSON.parse(rawBody)

    // Handle Supabase Database Webhook format (triggers on auth.users INSERT)
    const record = payload.record
    if (!record?.id || !record?.email) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid payload: missing record.id or record.email' }))
      return
    }

    const supabaseId = record.id as string
    const email = record.email as string
    const displayName =
      (record.raw_user_meta_data?.display_name as string) ?? email.split('@')[0] ?? 'New User'

    // Upsert — idempotent in case of retry
    const user = await prisma.user.upsert({
      where: { supabaseId },
      update: {}, // Don't overwrite if already exists
      create: {
        supabaseId,
        email,
        displayName,
      },
    })

    console.log(`[webhook] User created/found: ${user.id} (${user.email})`)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, userId: user.id }))
  } catch (err) {
    console.error('[webhook] Error processing Supabase auth webhook:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

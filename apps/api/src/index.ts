import 'dotenv/config'
import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { schema } from './schema/index.js'
import { createContext } from './lib/context.js'
import { handleSupabaseAuthWebhook } from './webhooks/supabase-auth.js'
import { handleLocalUpload, getStorageMode } from './lib/storage.js'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

const yoga = createYoga({
  schema,
  context: createContext,
})

const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads')

const server = createServer(async (req, res) => {
  // Route webhook endpoints before GraphQL
  if (req.url === '/webhooks/supabase-auth') {
    handleSupabaseAuthWebhook(req, res)
    return
  }

  // Local dev: handle file upload PUT
  if (req.method === 'PUT' && req.url?.startsWith('/uploads/put')) {
    const url = new URL(req.url, `http://localhost`)
    const key = url.searchParams.get('key')
    if (!key) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing key parameter' }))
      return
    }

    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks)
        await handleLocalUpload(key, body)
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        console.error('[upload] Local upload failed:', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Upload failed' }))
      }
    })
    return
  }

  // Local dev: serve uploaded files
  if (
    req.method === 'GET' &&
    req.url?.startsWith('/uploads/') &&
    !req.url.startsWith('/uploads/put')
  ) {
    const filePath = join(LOCAL_UPLOAD_DIR, req.url.replace('/uploads/', ''))
    try {
      const data = await readFile(filePath)
      const ext = filePath.split('.').pop() ?? ''
      const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      }
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(data)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
    return
  }

  // CORS preflight for upload endpoint
  if (req.method === 'OPTIONS' && req.url?.startsWith('/uploads/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  // Everything else goes to GraphQL Yoga
  yoga(req, res)
})

const port = parseInt(process.env.PORT ?? '4000', 10)

server.listen(port, () => {
  const mode = getStorageMode()
  console.log(`GraphQL API running at http://localhost:${port}/graphql`)
  console.log(`Webhooks listening at http://localhost:${port}/webhooks/supabase-auth`)
  console.log(`Storage mode: ${mode}${mode === 'local' ? ` (uploads at ${LOCAL_UPLOAD_DIR})` : ''}`)
})

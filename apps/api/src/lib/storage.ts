import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1'
const S3_BUCKET = process.env.S3_BUCKET ?? ''
const CDN_URL = process.env.CDN_URL ?? ''
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID ?? ''
const BUCKET_PREFIX = 'enc-'

// Local dev storage directory (relative to project root)
const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads')
const API_PORT = process.env.PORT ?? '4000'

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------

function isAwsConfigured(): boolean {
  return Boolean(S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

function validateBucketName(bucket: string): void {
  if (!bucket.startsWith(BUCKET_PREFIX)) {
    throw new Error(
      `[storage] BLOCKED: S3 bucket "${bucket}" does not start with required prefix "${BUCKET_PREFIX}". ` +
        `This is a safety check to prevent connecting to unintended buckets.`,
    )
  }
}

let accountIdVerified = false

async function validateAwsAccountId(): Promise<void> {
  if (accountIdVerified) return
  if (!AWS_ACCOUNT_ID) {
    throw new Error(
      '[storage] BLOCKED: AWS_ACCOUNT_ID environment variable is not set. ' +
        'This is required to verify you are connected to the correct AWS account. ' +
        'Set it to your expected AWS account ID (12-digit number).',
    )
  }

  const sts = new STSClient({ region: AWS_REGION })
  const { Account } = await sts.send(new GetCallerIdentityCommand({}))

  if (Account !== AWS_ACCOUNT_ID) {
    throw new Error(
      `[storage] BLOCKED: AWS credentials belong to account ${Account}, ` +
        `but AWS_ACCOUNT_ID is set to ${AWS_ACCOUNT_ID}. ` +
        `Refusing to proceed — this may be the wrong account.`,
    )
  }

  accountIdVerified = true
  console.log(`[storage] AWS account verified: ${Account}`)
}

// ---------------------------------------------------------------------------
// S3 Storage (production)
// ---------------------------------------------------------------------------

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: AWS_REGION,
      ...(process.env.AWS_ENDPOINT && {
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
      }),
    })
  }
  return s3Client
}

async function createS3PresignedUpload(
  folder: string,
  contentType: string,
  userId: string,
): Promise<PresignedUpload> {
  // Run guardrails
  validateBucketName(S3_BUCKET)
  await validateAwsAccountId()

  const ext = contentType.split('/')[1] ?? 'bin'
  const key = `${folder}/${userId}/${randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(getS3Client(), command, { expiresIn: 300 })

  const publicUrl = CDN_URL ? `${CDN_URL}/${key}` : `https://${S3_BUCKET}.s3.amazonaws.com/${key}`

  return { url, key, publicUrl }
}

// ---------------------------------------------------------------------------
// Local Filesystem Storage (development)
// ---------------------------------------------------------------------------

async function createLocalUpload(
  folder: string,
  contentType: string,
  userId: string,
): Promise<PresignedUpload> {
  const ext = contentType.split('/')[1] ?? 'bin'
  const filename = `${randomUUID()}.${ext}`
  const relativePath = `${folder}/${userId}`
  const dirPath = join(LOCAL_UPLOAD_DIR, relativePath)

  // Ensure directory exists
  await mkdir(dirPath, { recursive: true })

  const key = `${relativePath}/${filename}`
  // The "presigned URL" for local dev is the API's upload endpoint
  const url = `http://localhost:${API_PORT}/uploads/put?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`
  // Use a relative path so it works through the Vite proxy
  const publicUrl = `/uploads/${key}`

  return { url, key, publicUrl }
}

/**
 * Handle local file upload (called by the API's upload PUT endpoint).
 * Writes the file body to the local uploads directory.
 */
export async function handleLocalUpload(key: string, body: Buffer): Promise<void> {
  const filePath = join(LOCAL_UPLOAD_DIR, key)
  const dir = join(filePath, '..')
  await mkdir(dir, { recursive: true })
  await writeFile(filePath, body)
}

// ---------------------------------------------------------------------------
// Public Interface
// ---------------------------------------------------------------------------

export interface PresignedUpload {
  url: string
  key: string
  publicUrl: string
}

/**
 * Create a presigned upload URL.
 * - If AWS is configured: validates account ID + bucket prefix, then uses S3
 * - If AWS is not configured: uses local filesystem storage
 */
export async function createPresignedUpload(
  folder: string,
  contentType: string,
  userId: string,
): Promise<PresignedUpload> {
  if (isAwsConfigured()) {
    return createS3PresignedUpload(folder, contentType, userId)
  }
  return createLocalUpload(folder, contentType, userId)
}

/**
 * Returns the storage mode currently in use.
 */
export function getStorageMode(): 's3' | 'local' {
  return isAwsConfigured() ? 's3' : 'local'
}

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  ...(process.env.AWS_ENDPOINT && {
    endpoint: process.env.AWS_ENDPOINT,
    forcePathStyle: true,
  }),
})

const BUCKET = process.env.S3_BUCKET ?? 'enc-uploads'

export interface PresignedUpload {
  url: string
  key: string
  publicUrl: string
}

export async function createPresignedUpload(
  folder: string,
  contentType: string,
  userId: string,
): Promise<PresignedUpload> {
  const ext = contentType.split('/')[1] ?? 'bin'
  const key = `${folder}/${userId}/${randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 300 })

  const publicUrl = process.env.CDN_URL
    ? `${process.env.CDN_URL}/${key}`
    : `https://${BUCKET}.s3.amazonaws.com/${key}`

  return { url, key, publicUrl }
}

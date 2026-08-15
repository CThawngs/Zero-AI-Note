import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request.cookies.get('zero_ai_note_session')?.value ?? '');
    if (!session) {
      return fail('Unauthorized', 401);
    }

    const body = await request.json();
    const { fileName, contentType, fileSize } = body;

    if (!fileName || !contentType || !fileSize) {
      return fail('Missing file metadata', 400);
    }

    // Validate file size (max 2GB for free tier upload)
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (fileSize > maxSize) {
      return fail('File too large (max 2GB)', 400);
    }

    // Validate type
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm',
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!allowedTypes.includes(contentType)) {
      return fail('Unsupported file type', 400);
    }

    // Generate R2 presigned URL
    // In production, use Cloudflare R2 SDK or AWS S3 SDK
    const uploadId = crypto.randomUUID();
    const key = `${session.sub}/${uploadId}/${encodeURIComponent(fileName)}`;

    // Mock presigned URL for dev — replace with real R2/S3 presigned URL in production
    const presignedUrl = `/api/upload/put?key=${key}&uploadId=${uploadId}`;

    // TODO: In production, generate real R2 presigned PUT URL:
    // const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    // const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    // const client = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY } });
    // const presignedUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }), { expiresIn: 3600 });

    return ok({
      uploadUrl: presignedUrl,
      key,
      uploadId,
      expiresIn: 3600,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
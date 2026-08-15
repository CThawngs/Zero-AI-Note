import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession(request.cookies.get('zero_ai_note_session')?.value ?? '');
    if (!session) {
      return fail('Unauthorized', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const uploadId = searchParams.get('uploadId');

    if (!key || !uploadId) {
      return fail('Missing key or uploadId', 400);
    }

    // Verify the key belongs to this user
    if (!key.startsWith(`${session.sub}/`)) {
      return fail('Invalid upload key', 403);
    }

    // Get the file stream
    const body = request.body;
    if (!body) {
      return fail('Empty file', 400);
    }

    // In dev, we just acknowledge the upload
    // In production, stream to R2/S3:
    // const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    // const client = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY } });
    // await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: request.headers.get('content-type') }));

    return ok({
      success: true,
      key,
      uploadId,
      message: 'Upload successful (dev mock)',
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
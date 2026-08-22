import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { storageService } from '@/lib/storage';

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

    // Generate REAL Cloudflare R2 presigned URL via storage abstraction layer
    const { uploadUrl, key } = await storageService.generatePresignedUploadUrl(
      session.sub,
      fileName,
      contentType,
      fileSize
    );

    // Public URL để client lưu metadata — KHÔNG import server module ở client
    const publicUrl = await storageService.getPublicUrl(key);

    return ok({
      uploadUrl,
      key,
      publicUrl,
      uploadId: key.split('/')[1],
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('presign failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
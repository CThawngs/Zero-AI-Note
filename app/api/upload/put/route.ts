import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { storageService } from '@/lib/storage';

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

    // Với R2 presigned URL, client đã upload thẳng lên R2.
    // Route này chỉ xác nhận upload thành công trong DB (tracking).
    await storageService.confirmUpload(key);

    return ok({
      success: true,
      key,
      uploadId,
      message: 'Upload confirmed',
    });
  } catch (error) {
    console.error('confirm upload failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
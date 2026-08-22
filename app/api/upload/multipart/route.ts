import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { storageService } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * Multipart upload helpers (PRD 4.1, DECISIONS.md §31): file >100MB.
 * POST { action: 'sign', key, uploadId, partNumber } → presigned URL cho 1 part
 * POST { action: 'complete', key, uploadId, parts: [{ETag, PartNumber}] } → finalize
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request.cookies.get('zero_ai_note_session')?.value ?? '');
    if (!session) return fail('Unauthorized', 401);

    const body = await request.json();
    const { action, key, uploadId } = body;

    if (!key || !uploadId || !action) return fail('Missing params', 400);
    // Chỉ cho phép thao tác trên key trong prefix của chính user
    if (!key.startsWith(`uploads/${session.sub}/`)) return fail('Forbidden key', 403);

    const client = await (storageService as any).getClient();
    const bucket = (storageService as any).bucketName ?? process.env.R2_BUCKET_NAME;

    if (action === 'sign') {
      const { partNumber } = body;
      if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
        return fail('Invalid partNumber', 400);
      }
      const { UploadPartCommand } = await import('@aws-sdk/client-s3');
      const cmd = new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: partNumber });
      const url = await (await import('@aws-sdk/s3-request-presigner')).getSignedUrl(client, cmd, { expiresIn: 3600 });
      return ok({ partUrl: url, partNumber });
    }

    if (action === 'complete') {
      const { parts } = body as { parts: Array<{ ETag: string; PartNumber: number }> };
      if (!Array.isArray(parts) || parts.length === 0) return fail('Missing parts', 400);
      parts.sort((a, b) => a.PartNumber - b.PartNumber);
      const { CompleteMultipartUploadCommand } = await import('@aws-sdk/client-s3');
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: bucket, Key: key, UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }));
      return ok({ done: true });
    }

    if (action === 'abort') {
      const { AbortMultipartUploadCommand } = await import('@aws-sdk/client-s3');
      await client.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId }));
      return ok({ aborted: true });
    }

    return fail('Unknown action', 400);
  } catch (err) {
    console.error('[multipart] error:', err);
    return fail('Multipart operation failed', 500);
  }
}

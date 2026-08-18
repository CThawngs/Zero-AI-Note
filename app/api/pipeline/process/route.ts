import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { checkNoteLimit } from '@/lib/neon/queries';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('zero_ai_note_session')?.value;
    const session = await verifySession(token ?? '');
    if (!session) {
      return fail('Unauthorized', 401);
    }

    const body = await request.json();
    const { key, method = 'cornell', language = 'vi', model = 'gemini-2.0-flash' } = body;

    if (!key) {
      return fail('Missing file key', 400);
    }

    const limitCheck = await checkNoteLimit(session.sub);
    if (!limitCheck.allowed) {
      return fail(
        limitCheck.message || `Đã đạt giới hạn tối đa ${limitCheck.limit} ghi chú. Vui lòng nâng cấp gói Pro hoặc Ultra.`,
        403
      );
    }

    const sql = getSql();

    const jobId = crypto.randomUUID();
    await sql`
      insert into jobs (id, user_id, source_key, method, language, model, status, created_at)
      values (${jobId}, ${session.sub}, ${key}, ${method}, ${language}, ${model}, 'queued', now())
    `;

    return ok({
      jobId,
      status: 'queued',
      message: 'File queued for processing',
    });
  } catch (error) {
    console.error('pipeline process failed:', error);
    return fail('Internal server error', 500);
  }
}
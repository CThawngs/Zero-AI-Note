import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

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

    const sql = getSql();
    const userRows = await sql`
      select processing_minutes_used, processing_minutes_limit, plan
      from profiles where id = ${session.sub}
    `;
    const firstUser = Array.isArray(userRows) ? userRows[0] : userRows;
    const user = firstUser as
      | { processing_minutes_used: number; processing_minutes_limit: number; plan: string }
      | undefined;

    if (!user) {
      return fail('User not found', 404);
    }

    if (user.processing_minutes_used >= user.processing_minutes_limit) {
      return fail(
        `Monthly processing limit reached (${user.processing_minutes_limit} minutes). Upgrade plan for more.`,
        403
      );
    }

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
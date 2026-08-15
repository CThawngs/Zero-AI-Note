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
    const { key, method = 'cornell', language = 'vi', model = 'gemini-2.0-flash' } = body;

    if (!key) {
      return fail('Missing file key', 400);
    }

    // Check user's processing minutes quota
    const { sql, getPool } = await import('@/lib/db');
    const pool = getPool();
    const userRes = await pool.query(
      'select processing_minutes_used, processing_minutes_limit, plan from profiles where id = $1',
      [session.sub]
    );

    if (userRes.rows.length === 0) {
      return fail('User not found', 404);
    }

    const user = userRes.rows[0];
    if (user.processing_minutes_used >= user.processing_minutes_limit) {
      return fail(
        `Monthly processing limit reached (${user.processing_minutes_limit} minutes). Upgrade plan for more.`,
        403
      );
    }

    // Check file exists in R2 (mock check)
    // In production: HEAD object in R2

    // Create job entry
    const jobId = crypto.randomUUID();
    await sql`
      insert into jobs (id, user_id, source_key, method, language, model, status, created_at)
      values (${jobId}, ${session.sub}, ${key}, ${method}, ${language}, ${model}, 'queued', now())
    `;

    // Enqueue background job (Inngest/Trigger.dev)
    // In production: await inngest.send({ name: 'process-file', data: { jobId } })

    return ok({
      jobId,
      status: 'queued',
      message: 'File queued for processing',
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
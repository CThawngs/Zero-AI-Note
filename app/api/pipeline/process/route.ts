import { NextRequest } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { checkNoteLimit } from '@/lib/neon/queries';
import { inngest } from '@/lib/inngest/client';

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

    // Lấy plan hiện tại của user để worker gating đúng theo gói (PRD 4.2)
    let userPlan: 'free' | 'pro' | 'ultra' = 'free';
    try {
      const profileRows = (await sql`
        select plan from profiles where id::text = ${session.sub} limit 1
      `) as unknown as { plan: string }[];
      if (profileRows.length > 0 && ['pro', 'ultra'].includes(profileRows[0].plan)) {
        userPlan = profileRows[0].plan as 'pro' | 'ultra';
      }
    } catch (profileErr) {
      console.warn('[pipeline/process] plan lookup failed, default free:', profileErr);
    }

    const jobId = crypto.randomUUID();
    await sql`
      insert into jobs (id, user_id, source_key, method, language, model, status, created_at)
      values (${jobId}, ${session.sub}, ${key}, ${method}, ${language}, ${model}, 'queued', now())
    `;

    // Enqueue job qua Inngest — worker sẽ xử lý nền (PRD mục 3.2)
    try {
      await inngest.send({
        name: 'note/pipeline.process',
        data: {
          jobId,
          userId: session.sub,
          sourceKey: key,
          method,
          language,
          model,
          userPlan,
        },
      });
    } catch (enqueueError) {
      // Fail-safe: nếu Inngest chưa được cấu hình (thiếu INNGEST_EVENT_KEY),
      // đánh dấu job lỗi rõ ràng để client polling nhận được thông báo,
      // không treo vô hạn ở trạng thái queued.
      console.error('[pipeline/process] Inngest enqueue failed:', enqueueError);
      await sql`
        update jobs
        set status = 'error', error = 'Inngest chưa được cấu hình trên server. Vui lòng thử lại sau.'
        where id = ${jobId}
      `;
      return ok({
        jobId,
        status: 'error',
        message: 'Inngest not configured',
      });
    }

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

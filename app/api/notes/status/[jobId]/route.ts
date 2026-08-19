import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// GET /api/notes/status/[jobId]
// Polling endpoint theo PRD mục 3.2: trình duyệt Polling mỗi 2–3s tới đây
// để lấy tiến trình job xử lý file (Stepper: [1] Trích Transcript →
// [2] Phân tích cấu trúc → [3] Hoàn thiện Note).
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;
    if (!jobId) {
      return fail('Missing jobId', 400);
    }

    const token = _request.cookies.get('zero_ai_note_session')?.value;
    const session = await verifySession(token ?? '');
    if (!session) {
      return fail('Unauthorized', 401);
    }

    const sql = getSql();
    const result = await sql`
      select id, user_id, source_key, note_id, method, language, model, status, error, created_at, updated_at
      from jobs
      where id = ${jobId}
      limit 1
    `;
    const rows = result as unknown as Record<string, any>[];

    if (rows.length === 0) {
      return ok({ jobId, status: 'not_found', progress: 0, step: 0, error: null, found: false });
    }

    const job = rows[0];

    // Chỉ chủ sở hữu job (hoặc admin) được đọc trạng thái
    if (job.user_id !== session.sub && session.role !== 'admin') {
      return fail('Forbidden', 403);
    }

    // Map status DB → progress % + step index (Stepper 3 bước)
    let progress = 0;
    let step = 0;
    let stepLabel = '';
    switch (job.status) {
      case 'queued':
        progress = 5; step = 0; stepLabel = 'Xếp hàng';
        break;
      case 'processing':
        progress = 55; step = 2; stepLabel = 'Đang xử lý';
        break;
      case 'error':
        progress = -1; step = 0; stepLabel = 'Lỗi';
        break;
      case 'done':
        progress = 100; step = 3; stepLabel = 'Hoàn tất';
        break;
      default:
        progress = 0; step = 0; stepLabel = 'Khởi tạo';
    }

    return ok({
      jobId,
      status: job.status,
      progress,
      step,
      stepLabel,
      method: job.method,
      language: job.language,
      model: job.model,
      noteId: job.note_id || null,
      sourceKey: job.source_key || null,
      error: job.error || null,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      found: true,
    });
  } catch (error) {
    console.error('note status failed:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
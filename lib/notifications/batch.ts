import { Resend } from 'resend';
import { getSql } from '@/lib/db';

/**
 * Email hoàn tất theo BATCH (2026-08-23) — N file đính kèm cùng 1 tin nhắn
 * gửi ĐÚNG 1 email khi tất cả xong, không gửi từng file (DECISIONS.md §25).
 *
 * Luồng (chạy cuối mỗi job xử lý 1 source):
 * 1. batch_group_id NULL → file lẻ → giữ hành vi cũ (gửi ngay khi xong).
 * 2. Có batch → còn file pending/processing → dừng (chưa phải file cuối).
 * 3. Tất cả processed/error VÀ note đã sinh (content_structured tồn tại)
 *    → claim qua `update notebooks set notification_sent_at = now()
 *    where id = X and notification_sent_at is null returning id` — atomic,
 *    race 2 job cùng lúc chỉ 1 job claim được.
 * 4. Chống spam: batch xong <2 phút kể từ file đầu → vẫn set flag nhưng
 *    KHÔNG gọi Resend (user đang xem Processing Card trực tiếp).
 */

const BATCH_MIN_WAIT_MS = 2 * 60 * 1000;

export interface BatchFileStatus {
  name: string;
  status: 'processed' | 'error';
  errorHint?: string;
}

/** Map lỗi kỹ thuật sang lời dễ hiểu cho email. */
function friendlyError(sourceRow: { type: string | null; error_detail?: string | null; transcript: string | null }): string {
  if (!sourceRow.transcript && sourceRow.type === 'youtube') return 'Không lấy được nội dung video';
  if (sourceRow.type === 'audio' || sourceRow.type === 'video') return 'Định dạng âm thanh/video không hỗ trợ hoặc file hỏng';
  if (sourceRow.type === 'pdf') return 'Tài liệu không đọc được (có thể là bản scan lỗi)';
  return 'Định dạng không hỗ trợ';
}

/**
 * Claim quyền gửi email cho notebook — ATOMIC, chống race:
 * update ... where notification_sent_at is null returning id.
 * Trả true nếu job này thắng claim.
 */
export async function claimBatchNotification(notebookId: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    update notebooks
    set notification_sent_at = now()
    where id = ${notebookId} and notification_sent_at is null
    returning id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}

/**
 * Kiểm tra batch hoàn tất chưa. Trả về:
 * - done: tất cả sources trong batch đã processed/error và có note sinh ra
 * - shouldSend: đã đến lượt gửi (file cuối) — caller tự claim trước khi gửi
 */
export async function checkBatchCompletion(batchGroupId: string): Promise<{
  isComplete: boolean;
  files: BatchFileStatus[];
  notebookId: string | null;
  oldestCreatedAt: Date | null;
}> {
  const sql = getSql();
  const siblings = await sql`
    select s.file_url, s.status, s.type, s.transcript, s.created_at, s.notebook_id
    from sources s
    where s.batch_group_id = ${batchGroupId}
    order by s.created_at asc
  `;
  const rows = siblings as unknown as {
    file_url: string | null;
    status: string | null;
    type: string | null;
    transcript: string | null;
    created_at: string;
    notebook_id: string | null;
  }[];

  const stillPending = rows.some(r => r.status === 'pending' || r.status === 'processing');
  if (stillPending) {
    return { isComplete: false, files: [], notebookId: null, oldestCreatedAt: null };
  }

  // Note đã sinh? (ít nhất 1 note của notebook chứa batch này có content_structured)
  const notebookId = rows.find(r => r.notebook_id)?.notebook_id || null;
  let hasNote = false;
  if (notebookId) {
    const notes = (await sql`
      select id from notes
      where notebook_id = ${notebookId} and content_structured is not null
      limit 1
    `) as unknown as { id: string }[];
    hasNote = notes.length > 0;
  }

  const files: BatchFileStatus[] = rows.map(r => ({
    name: r.file_url?.split('/').pop() || 'file',
    status: r.status === 'error' ? 'error' : 'processed',
    ...(r.status === 'error' ? { errorHint: friendlyError(r) } : {}),
  }));

  const createdAtList = rows.map(r => new Date(r.created_at)).filter(d => !isNaN(d.getTime()));
  const oldestCreatedAt = createdAtList.length ? new Date(Math.min(...createdAtList.map(d => d.getTime()))) : null;

  return { isComplete: hasNote, files, notebookId, oldestCreatedAt };
}

/** Build + gửi email batch qua Resend. */
export async function sendBatchCompletionEmail(params: {
  userEmail: string;
  notebookId: string;
  notebookTitle: string;
  files: BatchFileStatus[];
}): Promise<{ sent: boolean; skipped?: string }> {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) return { sent: false, skipped: 'RESEND_API_KEY missing' };

  const resend = new Resend(apiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zero-ai-note.vercel.app';
  const noteLink = `${appUrl}/notebook?id=${params.notebookId}`;

  const n = params.files.length;
  const okCount = params.files.filter(f => f.status === 'processed').length;
  const failed = params.files.filter(f => f.status === 'error');

  const subject =
    n <= 1
      ? 'Note của bạn đã sẵn sàng'
      : `${okCount}/${n} file đã xử lý xong`;

  const fileListHtml = params.files
    .map(
      f =>
        `<li style="margin:4px 0;"><span style="color:${f.status === 'error' ? '#dc2626' : '#16a34a'};font-weight:bold;">${f.status === 'error' ? '✕ Lỗi' : '✓ Xong'}</span> — ${escapeHtml(f.name)}${f.errorHint ? ` <span style="color:#6b7280;">(${escapeHtml(f.errorHint)})</span>` : ''}</li>`
    )
    .join('');

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
  <h2 style="margin-bottom:8px;">${params.files.length > 1 ? 'Xử lý hàng loạt hoàn tất' : 'Note của bạn đã sẵn sàng'}</h2>
  <p style="color:#374151;">"${escapeHtml(params.notebookTitle)}" — ${n} tệp nguồn:</p>
  <ul style="padding-left:20px;">${fileListHtml}</ul>
  ${failed.length ? `<p style="color:#6b7280;font-size:13px;">Các tệp lỗi có thể thử tải lên lại với định dạng khác.</p>` : ''}
  <p style="margin-top:24px;">
    <a href="${noteLink}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Mở note ngay</a>
  </p>
  <p style="color:#9ca3af;font-size:12px;margin-top:32px;">Zero AI Note — ghi chú thông minh từ mọi nguồn.</p>
</div>`.trim();

  try {
    const res = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Zero AI Note <onboarding@resend.dev>',
      to: [params.userEmail],
      subject,
      html,
    });
    if (res.error) {
      console.error('[batch-email] Resend error:', res.error);
      return { sent: false, skipped: String(res.error) };
    }
    return { sent: true };
  } catch (e) {
    console.error('[batch-email] send failed:', e);
    return { sent: false, skipped: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

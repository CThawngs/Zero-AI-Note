import { inngest } from './client';
import { getSql } from '@/lib/db';
import { dispatchStructuredNote } from '@/lib/ai/dispatcher';
import { createNote } from '@/lib/neon/queries';
import { reserveQuota, commitQuota, releaseQuota } from '@/lib/quota/reserve';
import { storageService } from '@/lib/storage';
import {
  claimBatchNotification,
  checkBatchCompletion,
  sendBatchCompletionEmail,
} from '@/lib/notifications/batch';

/**
 * Worker xử lý pipeline note (PRD mục 3.2):
 * [1] Trích Transcript → [2] Phân tích cấu trúc → [3] Hoàn thiện Note
 *
 * Job chạy nền qua Inngest, không bị timeout 60s của Vercel.
 * Concurrency giới hạn 2 job song song (PRD mục 10) — tránh 429 Gemini.
 * Atomic quota reservation + safety valve 90% (PRD 3.3) wrap toàn pipeline.
 */
export const processNotePipeline = inngest.createFunction(
  {
    id: 'process-note-pipeline',
    name: 'Process Note Pipeline',
    concurrency: 2,
    retries: 2,
    triggers: [{ event: 'note/pipeline.process' }],
  },
  async ({ event, step }) => {
    const { jobId, userId, sourceKey, method, language, model, userPlan = 'free' } = event.data;

    const sql = getSql();

    // Bước [0] Reserve quota (atomic, safety valve 90%) — fail-fast trước khi đụng AI
    const reservation = await step.run('reserve-quota', async () => {
      const r = await reserveQuota(userId, 'ai_tokens', 1_000, userPlan); // ước tính 1k Neurons/job
      if (!r.ok) {
        throw new Error(r.message || 'Quota exhausted');
      }
      return r;
    });

    // Bước [1] mark-processing
    await step.run('mark-processing', async () => {
      await sql`update jobs set status = 'processing', updated_at = now() where id = ${jobId}`;
      return true;
    });

    // Bước [0.5] MediaProcessor (PRD 4.0.4, DECISIONS.md §31): file audio/video ≥100MB
    // → ffmpeg stream copy + segment 45p TRƯỚC khi ASR; dưới ngưỡng đi extract.ts như cũ.
    await step.run('media-process', async () => {
      try {
        const srcRows = (await sql`
          select type, file_url from sources
          where id = ${sourceKey} or file_url = ${sourceKey}
          limit 1
        `) as unknown as Array<{ type: string; file_url: string | null }>;
        const srcType = srcRows[0]?.type ?? '';
        const fileUrl = srcRows[0]?.file_url;
        if (!['audio', 'video'].includes(srcType) || !fileUrl) return { skipped: 'not-large-media' };

        const { shouldUseMediaProcessor } = await import('@/lib/media/processor');
        // size từ HEAD object R2 — key chính là file_url nếu storage key
        let head: { sizeBytes: number } | null = null;
        try {
          const { storageService } = await import('@/lib/storage');
          const client = await (storageService as any).getClient();
          const bucket = (storageService as any).bucketName ?? process.env.R2_BUCKET_NAME;
          const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
          const h = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: fileUrl }));
          head = { sizeBytes: h.ContentLength ?? 0 };
        } catch {
          return { skipped: 'head-failed' };
        }
        if (!head || !shouldUseMediaProcessor(head.sizeBytes, srcType)) {
          return { skipped: 'below-threshold' };
        }

        const { inngestFFmpegProcessor } = await import('@/lib/media/inngest-ffmpeg-processor');
        const { audioKey, durationSeconds } = await inngestFFmpegProcessor.extractAudio(fileUrl);
        const segments = await inngestFFmpegProcessor.createSegments(audioKey);
        // Lưu danh sách segment vào sources.transcript marker — ASR step đọc được
        await sql`update sources set transcript = ${'__SEGMENTS__:' + JSON.stringify(segments)} where id = ${sourceKey}`;
        return { segments: segments.length, durationSeconds };
      } catch (mediaErr) {
        console.warn('[pipeline] media-process failed, fallback to legacy path:', mediaErr);
        return { skipped: 'processor-error' };
      }
    });

    // Bước [1] Trích Transcript — lấy nội dung nguồn
    const inputText = await step.run('extract-transcript', async () => {
      const sourceRows = (await sql`
        select transcript, file_url from sources
        where id = ${sourceKey} or file_url = ${sourceKey}
        limit 1
      `) as unknown as { transcript: string | null; file_url: string | null }[];

      if (sourceRows.length > 0 && sourceRows[0].transcript) {
        return sourceRows[0].transcript;
      }
      if (sourceRows.length > 0 && sourceRows[0].file_url) {
        return `Nội dung nguồn (file: ${sourceKey}): ${sourceRows[0].file_url}`;
      }
      return `Nội dung nguồn tải lên: ${sourceKey}`;
    });

    // Bước [2] Phân tích cấu trúc + [3] Hoàn thiện Note
    const generated = await step.run('generate-note', async () => {
      return dispatchStructuredNote({
        inputText,
        method: method as any,
        language,
        model,
        userPlan: (userPlan || 'free') as 'free' | 'pro' | 'ultra',
      });
    });

    await step.run('save-note', async () => {
      const note = await createNote({
        user_id: userId,
        title: generated.title,
        method: generated.method,
        output_language: language,
        content_structured: generated,
        confidence_flags: {},
      });
      await sql`update jobs set status = 'done', note_id = ${note.id}, updated_at = now() where id = ${jobId}`;
      return note.id;
    });

    // Commit quota đã reserve (job thành công)
    await step.run('commit-quota', async () => {
      await commitQuota(userId, 'ai_tokens', 1_000);
      return true;
    });

    // ── Batch email notification (DECISIONS.md §25): chạy cuối mỗi job.
    // File lẻ (batch_group_id NULL) → gửi ngay. Batch → chỉ file CUỐI cùng
    // hoàn tất mới claim + gửi ĐÚNG 1 email cho cả batch.
    await step.run('batch-email-check', async () => {
      const srcRows = (await sql`
        select id, batch_group_id, notebook_id from sources
        where id = ${sourceKey} or file_url = ${sourceKey}
        limit 1
      `) as unknown as { id: string; batch_group_id: string | null; notebook_id: string | null }[];

      const src = srcRows[0];
      if (!src?.batch_group_id || !src.notebook_id) {
        return { skipped: 'single-file (không có batch_group_id) — giữ hành vi cũ' };
      }

      const batch = await checkBatchCompletion(src.batch_group_id);
      if (!batch.isComplete) {
        return { skipped: 'batch chưa hoàn tất (còn file pending/processing hoặc chưa có note)' };
      }

      // Chống spam: batch xong <2 phút kể từ file đầu → user đang xem trực tiếp,
      // vẫn claim flag nhưng không gọi Resend.
      const ageMs = batch.oldestCreatedAt ? Date.now() - batch.oldestCreatedAt.getTime() : Infinity;
      if (ageMs < 2 * 60 * 1000) {
        const claimed = await claimBatchNotification(src.notebook_id);
        return { skipped: claimed ? 'batch xong <2 phút — user đang xem trực tiếp, không gửi mail' : 'đã claim trước đó', claimed };
      }

      // Claim ATOMIC — race 2 job: chỉ 1 thắng.
      const claimed = await claimBatchNotification(src.notebook_id);
      if (!claimed) {
        return { skipped: 'email đã được gửi bởi job khác (notification_sent_at đã set)' };
      }

      const nbRows = (await sql`
        select title from notebooks where id = ${src.notebook_id} limit 1
      `) as unknown as { title: string }[];
      const userRows = (await sql`
        select email from profiles where id = ${userId} limit 1
      `) as unknown as { email: string }[];

      const result = await sendBatchCompletionEmail({
        userEmail: userRows[0]?.email || '',
        notebookId: src.notebook_id,
        notebookTitle: nbRows[0]?.title || 'Note của bạn',
        files: batch.files,
      });
      return { sent: result.sent, skipped: result.skipped };
    });

    return { jobId, status: 'done', title: generated.title };
  }
);

/**
 * Cron hằng ngày 03:00 UTC (10h sáng VN): retention purge media >500MB
 * đã processed khỏi R2 (PRD 4.0.4 — R2 storage-only, không giữ file gốc).
 * Chạy non-blocking per-file, tối đa 50 file/lượt.
 */
export const r2RetentionPurge = inngest.createFunction(
  {
    id: 'r2-retention-purge',
    name: 'R2 Retention Purge (>500MB)',
    triggers: [{ cron: 'TZ=Asia/Ho_Chi_Minh 0 3 * * *' }],
  },
  async ({ step }) => {
    const purged = await step.run('purge-large-media', async () => {
      return storageService.purgeLargeProcessedMedia(50);
    });
    return { purged };
  }
);

/**
 * Cron hằng ngày 03:30 VN: quota reconciliation (Architecture v1 §21).
 * Ngày mới tự có row mới (unique per period_start) nên việc chính là
 * dọn row lịch sử >35 ngày. ponytail: orphaned reservations (job fail
 * sau retries mà release không chạy) chưa track được per-job — cần
 * quotas.job_link khi đo đếm chính xác từng lõi.
 */
export const quotaReconcile = inngest.createFunction(
  {
    id: 'quota-reconcile',
    name: 'Daily Quota Reconciliation',
    triggers: [{ cron: 'TZ=Asia/Ho_Chi_Minh 30 3 * * *' }],
  },
  async ({ step }) => {
    const deleted = await step.run('purge-stale-quota-rows', async () => {
      const sql = getSql();
      const rows = (await sql`
        delete from quotas
        where period_start < current_date - interval '35 days'
        returning id
      `) as unknown as { id: string }[];
      return rows.length;
    });
    return { deleted };
  }
);

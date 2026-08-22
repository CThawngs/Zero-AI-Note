import { inngest } from './client';
import { getSql } from '@/lib/db';
import { dispatchStructuredNote } from '@/lib/ai/dispatcher';
import { createNote } from '@/lib/neon/queries';
import { reserveQuota, commitQuota, releaseQuota } from '@/lib/quota/reserve';
import { storageService } from '@/lib/storage';

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

import { inngest } from './client';
import { getSql } from '@/lib/db';
import { dispatchStructuredNote } from '@/lib/ai/dispatcher';
import { createNote } from '@/lib/neon/queries';

/**
 * Worker xử lý pipeline note (PRD mục 3.2):
 * [1] Trích Transcript → [2] Phân tích cấu trúc → [3] Hoàn thiện Note
 *
 * Job chạy nền qua Inngest, không bị timeout 60s của Vercel.
 * Concurrency giới hạn 2 job song song (PRD mục 10) — tránh 429 Gemini.
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

    // Bước [1] Trích Transcript
    await step.run('mark-processing', async () => {
      await sql`update jobs set status = 'processing', updated_at = now() where id = ${jobId}`;
      return true;
    });

    // Bước [1] Trích Transcript — lấy nội dung nguồn
    const inputText = await step.run('extract-transcript', async () => {
      const sourceRows = (await sql`
        select transcript, file_url, file_name from sources
        where id = ${sourceKey} or file_url = ${sourceKey}
        limit 1
      `) as unknown as { transcript: string | null; file_url: string | null; file_name: string | null }[];

      if (sourceRows.length > 0 && sourceRows[0].transcript) {
        return sourceRows[0].transcript;
      }
      if (sourceRows.length > 0 && sourceRows[0].file_url) {
        return `Nội dung nguồn (file: ${sourceRows[0].file_name || sourceKey}): ${sourceRows[0].file_url}`;
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

    return { jobId, status: 'done', title: generated.title };
  }
);

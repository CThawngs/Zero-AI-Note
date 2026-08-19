import { Inngest } from 'inngest';

/**
 * Inngest client — hàng đợi job nền cho xử lý file dài (PRD mục 3.1/3.2/10).
 * Không bị giới hạn timeout 60s của Vercel Serverless.
 *
 * INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY phải được set ở .env.local (dev)
 * và Vercel Environment Variables (prod). Không dùng tiền tố NEXT_PUBLIC_ —
 * key chỉ nằm server-side.
 */
export const inngest = new Inngest({
  id: 'zero-ai-note',
  name: 'Zero AI Note',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type AppEvents = {
  'note/pipeline.process': {
    data: {
      jobId: string;
      userId: string;
      sourceKey: string;
      method: string;
      language: 'vi' | 'en';
      model: string;
      userPlan?: 'free' | 'pro' | 'ultra';
    };
  };
};

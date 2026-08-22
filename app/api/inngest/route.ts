import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processNotePipeline, r2RetentionPurge } from '@/lib/inngest/functions';

/**
 * Inngest serve endpoint — cho phép Inngest Cloud gọi vào worker.
 * Route: /api/inngest
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processNotePipeline, r2RetentionPurge],
});

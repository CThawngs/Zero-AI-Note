export const runtime = 'nodejs';

import { getSql } from '@/lib/db';

export async function GET() {
  try {
    const result = await getSql()`select 1 as ok`;
    return Response.json({ ok: true, db: 'connected', result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, db: 'error', message }, { status: 500 });
  }
}
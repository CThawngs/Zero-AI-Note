export const runtime = 'nodejs';

import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`select 1 as ok`;
    return Response.json({ ok: true, db: 'connected', result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, db: 'error', message }, { status: 500 });
  }
}
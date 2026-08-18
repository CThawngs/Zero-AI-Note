import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSources } from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * GET /api/sources — trả về danh sách sources (files) của user đang đăng nhập.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await getSources(session.sub);
    return NextResponse.json({ sources: rows });
  } catch (err) {
    console.error('[GET /api/sources] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load sources' },
      { status: 500 }
    );
  }
}

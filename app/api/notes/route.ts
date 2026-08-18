import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getNotes } from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * GET /api/notes — trả về danh sách notes của user đang đăng nhập.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await getNotes(session.sub);
    return NextResponse.json({ notes: rows });
  } catch (err) {
    console.error('[GET /api/notes] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load notes' },
      { status: 500 }
    );
  }
}

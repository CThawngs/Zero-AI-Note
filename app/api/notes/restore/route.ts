import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { restoreNote } from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * POST /api/notes/restore?id=... — khôi phục note đã archive.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    }

    await restoreNote(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/notes/restore] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to restore note' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserProfile } from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * GET /api/profile — trả về profile của user đang đăng nhập.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserProfile(session.sub);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[GET /api/profile] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load profile' },
      { status: 500 }
    );
  }
}

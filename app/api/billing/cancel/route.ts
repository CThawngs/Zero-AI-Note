import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { downgradeUserPlan } from '@/lib/neon/queries';
import { updateUserPlan } from '@/lib/auth/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Downgrade in Neon DB & memory cache
    await downgradeUserPlan(session.sub);
    await updateUserPlan(session.sub, 'free');

    return NextResponse.json({
      ok: true,
      message: 'Subscription cancelled successfully. Account reverted to Free tier.',
      plan: 'free',
    });
  } catch (error) {
    console.error('[POST /api/billing/cancel] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
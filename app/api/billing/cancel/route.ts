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

    const body = await request.json().catch(() => ({}));
    const targetPlan: 'free' | 'pro' = body.plan === 'pro' ? 'pro' : 'free';

    // 1. Downgrade in Neon DB & memory cache
    await downgradeUserPlan(session.sub, targetPlan);
    await updateUserPlan(session.sub, targetPlan);

    return NextResponse.json({
      ok: true,
      message: targetPlan === 'pro' ? 'Downgraded to Pro plan successfully.' : 'Subscription cancelled successfully. Account reverted to Free tier.',
      plan: targetPlan,
    });
  } catch (error) {
    console.error('[POST /api/billing/cancel] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
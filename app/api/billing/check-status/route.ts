import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { checkZeroInvoiceBillStatus } from '@/lib/billing/zeroinvoice';
import { upgradeUserPlan } from '@/lib/neon/queries';
import { getSql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billId = request.nextUrl.searchParams.get('billId');
    const plan = (request.nextUrl.searchParams.get('plan') || 'pro') as 'pro' | 'ultra';

    if (!billId) {
      return NextResponse.json({ error: 'Missing billId' }, { status: 400 });
    }

    const billStatus = await checkZeroInvoiceBillStatus(billId);
    const isPaid = billStatus.status === 'paid' || billStatus.status === 'resolved';

    if (isPaid) {
      // Upgrade user profile plan
      await upgradeUserPlan(session.sub, plan, billId, billStatus.amount);

      // Update subscription record
      try {
        const sql = getSql();
        await sql`
          update subscriptions
          set status = 'paid', paid_at = now(), renews_at = now() + interval '30 days'
          where bill_id = ${billId}
        `;
      } catch (e) {
        console.warn('Subscription record update error:', e);
      }
    }

    return NextResponse.json({
      bill_id: billId,
      status: billStatus.status,
      isPaid,
      plan: isPaid ? plan : undefined,
    });
  } catch (error) {
    console.error('[GET /api/billing/check-status] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

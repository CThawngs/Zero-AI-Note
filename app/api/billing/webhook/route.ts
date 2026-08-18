import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserPlan } from '@/lib/neon/queries';
import { getSql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * POST /api/billing/webhook — Nhận webhook thanh toán từ ZeroInvoice / VietQR
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[ZeroInvoice Webhook Received]:', body);

    const billId = body.bill_id || body.id || body.data?.bill_id;
    const status = body.status || body.event || body.data?.status;
    const amount = body.amount || body.data?.amount;

    if (!billId) {
      return NextResponse.json({ error: 'Missing bill_id' }, { status: 400 });
    }

    const isPaid = status === 'paid' || status === 'resolved' || status === 'payment.completed' || status === 'bill.paid';

    if (isPaid) {
      const sql = getSql();
      // Look up subscription to find the user_id and target plan
      const subRows = (await sql`
        select user_id, amount, coupon_code from subscriptions
        where zeroinvoice_invoice_id = ${billId}
        limit 1
      `) as any[];

      if (subRows && subRows.length > 0) {
        const sub = subRows[0] as { user_id: string; amount: number; coupon_code?: string };
        // Determine plan based on amount or default
        const targetPlan = (amount || sub.amount) >= 150000 ? 'ultra' : 'pro';
        await upgradeUserPlan(sub.user_id, targetPlan, billId, amount || sub.amount, sub.coupon_code);

        await sql`
          update subscriptions
          set status = 'active', renews_at = now() + interval '30 days'
          where zeroinvoice_invoice_id = ${billId}
        `;
        console.log(`[ZeroInvoice Webhook] Successfully upgraded user ${sub.user_id} to ${targetPlan}`);
      }
    }

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error) {
    console.error('[ZeroInvoice Webhook Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing error' },
      { status: 500 }
    );
  }
}

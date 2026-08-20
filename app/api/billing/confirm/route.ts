import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSql } from '@/lib/db';
import { upgradeUserPlan } from '@/lib/neon/queries';

import { getZeroInvoiceBaseUrl } from '@/lib/billing/zeroinvoice';

export const runtime = 'nodejs';

/**
 * POST /api/billing/confirm — Xác nhận đã chuyển khoản (bank simulator)
 *
 * User đã chuyển tiền thật thành công qua QR → bấm "Tôi đã thanh toán xong".
 * App gọi Zero Tracking resolve bill (với webhook secret server-side) →
 * Zero Tracking đánh dấu bill = paid → gửi webhook bill.paid về
 * /api/billing/webhook → app upgrade plan (kênh chính).
 * Endpoint này cũng tự cập nhật subscription + profile (kênh phụ, idempotent).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billId } = body as { billId?: string };

    if (!billId) {
      return NextResponse.json({ error: 'Missing billId' }, { status: 400 });
    }

    const ZT_BASE = getZeroInvoiceBaseUrl();
    const ZT_WEBHOOK_SECRET = process.env.ZEROINVOICE_WEBHOOK_SECRET || process.env.VIETQR_WEBHOOK_SECRET;

    // 1) Resolve bill trên Zero Tracking (xác nhận đã thanh toán)
    let resolveRes;
    try {
      resolveRes = await fetch(`${ZT_BASE}/api/bills/${billId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ZT_WEBHOOK_SECRET ? { 'x-webhook-secret': ZT_WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify({ transaction_id: `confirm_${Date.now()}` }),
      });
    } catch (e) {
      console.error('[billing/confirm] resolve fetch error:', e);
      return NextResponse.json({ error: 'Cannot reach Zero Tracking' }, { status: 502 });
    }

    const resolveJson = await resolveRes.json().catch(() => ({}));
    const bill = resolveJson?.bill || resolveJson?.data?.bill || resolveJson?.data;

    if (!resolveRes.ok && !bill) {
      return NextResponse.json(
        { error: resolveJson?.error || 'Zero Tracking resolve failed', status: resolveRes.status },
        { status: 502 }
      );
    }

    const billStatus = bill?.status || (resolveJson?.alreadyPaid ? 'paid' : resolveJson?.status);

    // 2) Nếu bill đã paid → cập nhật subscription + profile (idempotent)
    if (billStatus === 'paid' || resolveJson?.alreadyPaid) {
      const sql = getSql();

      // Tìm subscription theo billId
      const subRows = (await sql`
        select user_id, plan, amount, coupon_code from subscriptions
        where bill_id = ${billId}
        limit 1
      `) as any[];

      if (subRows && subRows.length > 0) {
        const sub = subRows[0] as { user_id: string; plan: string; amount: number; coupon_code?: string };
        await upgradeUserPlan(sub.user_id, sub.plan as 'pro' | 'ultra', billId, sub.amount, sub.coupon_code);

        await sql`
          update subscriptions
          set status = 'paid', paid_at = now(), renews_at = now() + interval '30 days'
          where bill_id = ${billId}
        `;

        return NextResponse.json({ ok: true, status: 'paid', plan: sub.plan });
      }

      // Không có subscription (bill cũ) → vẫn update nếu user trong session
      await upgradeUserPlan(session.sub, 'pro', billId, bill?.amount || 0);
      return NextResponse.json({ ok: true, status: 'paid', plan: 'pro' });
    }

    return NextResponse.json({ ok: false, status: billStatus || 'pending' });
  } catch (error) {
    console.error('[POST /api/billing/confirm] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

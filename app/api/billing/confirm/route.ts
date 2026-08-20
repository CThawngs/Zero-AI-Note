import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSql } from '@/lib/db';
import { upgradeUserPlan } from '@/lib/neon/queries';
import { getZeroInvoiceBaseUrl } from '@/lib/billing/zeroinvoice';

export const runtime = 'nodejs';

/**
 * POST /api/billing/confirm — Native Zero Tracking Instant Payment Resolution
 *
 * User clicks "Tôi Đã Chuyển Tiền Thành Công".
 * 1. Zero AI Note securely calls Zero Tracking's native resolve endpoint:
 *    POST ${ZT_BASE}/api/bills/${billId}/resolve with server-side x-webhook-secret
 * 2. Zero Tracking verifies the bill and marks status = 'paid' (triggering Supabase Realtime update on Zero Tracking dashboard).
 * 3. Zero AI Note updates user profile (plan = 'pro' | 'ultra') and subscriptions table.
 * 4. Returns { ok: true, isPaid: true, status: 'paid', plan } to trigger client-side celebration and auto-close.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billId, plan } = body as { billId?: string; plan?: 'pro' | 'ultra' };

    if (!billId) {
      return NextResponse.json({ error: 'Missing billId' }, { status: 400 });
    }

    const ZT_BASE = getZeroInvoiceBaseUrl();
    const ZT_WEBHOOK_SECRET = process.env.VIETQR_WEBHOOK_SECRET || process.env.ZEROINVOICE_WEBHOOK_SECRET || 'zinews-vq-2026-secret';

    // 1) Resolve and mark bill = 'paid' natively on Zero Tracking
    let resolveRes;
    try {
      resolveRes = await fetch(`${ZT_BASE}/api/bills/${billId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': ZT_WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          transaction_id: `user_confirm_${Date.now()}`,
        }),
      });
    } catch (e) {
      console.error('[billing/confirm] Zero Tracking resolve error:', e);
      return NextResponse.json({ error: 'Cannot reach Zero Tracking server' }, { status: 502 });
    }

    const resolveJson = await resolveRes.json().catch(() => ({}));
    const bill = resolveJson?.bill || resolveJson?.data?.bill || resolveJson?.data;

    if (!resolveRes.ok && !bill) {
      return NextResponse.json(
        { error: resolveJson?.error || 'Không tìm thấy hóa đơn trên Zero Tracking' },
        { status: resolveRes.status || 400 }
      );
    }

    // 2) Nâng cấp quyền lợi tài khoản trong Neon DB
    const targetPlan = plan || 'pro';
    const amount = bill?.amount || (targetPlan === 'ultra' ? 199000 : 99000);
    await upgradeUserPlan(session.sub, targetPlan, billId, amount);

    try {
      const sql = getSql();
      await sql`
        update subscriptions
        set status = 'paid', paid_at = now(), renews_at = now() + interval '30 days'
        where bill_id = ${billId}
      `;
    } catch (e) {
      console.warn('Subscription record update warn:', e);
    }

    return NextResponse.json({
      ok: true,
      isPaid: true,
      status: 'paid',
      plan: targetPlan,
    });
  } catch (error) {
    console.error('[POST /api/billing/confirm] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

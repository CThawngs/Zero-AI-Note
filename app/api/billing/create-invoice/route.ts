import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createZeroInvoiceBill } from '@/lib/billing/zeroinvoice';
import { getSql } from '@/lib/db';
import {
  validateCouponForPlan,
  incrementCouponUsage,
} from '@/lib/neon/queries';
import { applyCouponDiscount } from '@/lib/billing/coupon';

export const runtime = 'nodejs';

// Plan base prices (VND)
const BASE_PRICE: Record<'pro' | 'ultra', number> = {
  pro: 99000,
  ultra: 199000,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, couponCode, billingCycle = 'monthly', paymentAccountId } = body as {
      plan: 'pro' | 'ultra';
      couponCode?: string;
      billingCycle?: 'monthly' | 'yearly';
      paymentAccountId?: string | null;
    };

    if (plan !== 'pro' && plan !== 'ultra') {
      return NextResponse.json({ error: 'Gói thanh toán không hợp lệ' }, { status: 400 });
    }

    // 1) Base price
    let baseAmount = BASE_PRICE[plan];
    if (billingCycle === 'yearly') {
      baseAmount = Math.round(baseAmount * 12 * 0.8); // 20% off yearly
    }

    // 2) Coupon (read-only validate + compute; usage incremented only on success)
    let finalAmount = baseAmount;
    let appliedCouponCode: string | null = null;
    if (couponCode && couponCode.trim()) {
      const coupon = await validateCouponForPlan(couponCode.trim(), plan);
      if (coupon) {
        finalAmount = applyCouponDiscount(baseAmount, coupon);
        appliedCouponCode = coupon.code;
      }
    }

    // 3) Payment account override (real-time switch on Zero Tracking).
    //    null = use the app's default payee on Zero Tracking's side.
    const payeeAccountId = paymentAccountId || undefined;

    // 4) Create bill on Zero Tracking
    let billResponse;
    try {
      billResponse = await createZeroInvoiceBill({
        amount: finalAmount,
        description: `Nang cap Zero AI Note ${plan.toUpperCase()} (${session.email || session.sub})`,
        payment_account_id: payeeAccountId,
      });
    } catch (ztErr) {
      console.error('[create-invoice] Zero Tracking bill creation failed:', ztErr);
      return NextResponse.json(
        { error: ztErr instanceof Error ? ztErr.message : 'Zero Tracking unavailable' },
        { status: 502 }
      );
    }

    if (billResponse.error || !billResponse.data) {
      return NextResponse.json(
        { error: billResponse.error || 'Failed to create ZeroInvoice bill' },
        { status: 502 }
      );
    }

    const bill = billResponse.data;

    // 5) Persist pending subscription (with coupon + chosen payee for traceability)
    try {
      const sql = getSql();
      await sql`
        insert into subscriptions (user_id, bill_id, plan, amount, status, qr_data, coupon_code, payment_account_id)
        values (${session.sub}, ${bill.bill_id}, ${plan}, ${finalAmount}, 'pending',
                ${bill.qr_data ? JSON.stringify(bill.qr_data) : null},
                ${appliedCouponCode}, ${payeeAccountId ?? null})
      `;
    } catch (e) {
      console.warn('[create-invoice] Could not save pending subscription:', e);
    }

    // 6) Increment coupon usage ONCE (only when bill actually created)
    if (appliedCouponCode) {
      try {
        const sql = getSql();
        await sql`
          update coupons set usage_count = usage_count + 1
          where code = ${appliedCouponCode}
        `;
      } catch (e) {
        console.warn('[create-invoice] Could not increment coupon usage:', e);
      }
    }

    return NextResponse.json({
      bill_id: bill.bill_id,
      amount: bill.amount,
      plan,
      billingCycle,
      payment_url: bill.payment_url,
      qr_data: bill.qr_data,
      payee: {
        payment_account_id: payeeAccountId ?? null,
        accountNo: bill.qr_data?.accountNo ?? null,
        bankName: bill.qr_data?.bankName ?? null,
        accountName: bill.qr_data?.accountName ?? null,
      },
      coupon: appliedCouponCode
        ? { code: appliedCouponCode, baseAmount, finalAmount }
        : null,
      expires_at: bill.expires_at,
    });
  } catch (error) {
    console.error('[POST /api/billing/create-invoice] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

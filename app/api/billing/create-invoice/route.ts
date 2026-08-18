import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createZeroInvoiceBill } from '@/lib/billing/zeroinvoice';
import { getSql } from '@/lib/db';
import { CouponItem } from '@/src/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, couponCode, billingCycle = 'monthly' } = body as {
      plan: 'pro' | 'ultra';
      couponCode?: string;
      billingCycle?: 'monthly' | 'yearly';
    };

    if (plan !== 'pro' && plan !== 'ultra') {
      return NextResponse.json({ error: 'Gói thanh toán không hợp lệ' }, { status: 400 });
    }

    // Base price in VND
    let baseAmount = plan === 'pro' ? 99000 : 199000;
    if (billingCycle === 'yearly') {
      baseAmount = baseAmount * 12 * 0.8; // 20% discount for yearly
    }

    // Check coupon if provided
    let finalAmount = baseAmount;
    let appliedCoupon: CouponItem | null = null;

    if (couponCode && couponCode.trim()) {
      try {
        const sql = getSql();
        const couponRows = (await sql`
          select * from coupons
          where code = ${couponCode.trim().toUpperCase()}
            and status = 'active'
            and (usage_limit is null or usage_count < usage_limit)
            and (expires_at is null or expires_at > now())
        `) as any[];
        if (couponRows && couponRows.length > 0) {
          appliedCoupon = couponRows[0] as unknown as CouponItem;
          if (appliedCoupon.discount_type === 'percent') {
            finalAmount = Math.max(0, finalAmount * (1 - appliedCoupon.discount_value / 100));
          } else {
            finalAmount = Math.max(0, finalAmount - appliedCoupon.discount_value);
          }
        }
      } catch (err) {
        console.warn('Coupon verification error:', err);
      }
    }

    // Minimum amount is 1000 VND for banking
    finalAmount = Math.max(1000, Math.round(finalAmount));

    const planLabel = plan.toUpperCase();
    const billResponse = await createZeroInvoiceBill({
      amount: finalAmount,
      description: `Nang cap Zero AI Note ${planLabel} (${session.email || session.sub})`,
    });

    if (billResponse.error || !billResponse.data) {
      throw new Error(billResponse.error || 'Failed to create ZeroInvoice bill');
    }

    const bill = billResponse.data;

    // Save pending subscription record
    try {
      const sql = getSql();
      await sql`
        insert into subscriptions (user_id, zeroinvoice_invoice_id, status, amount, coupon_code)
        values (${session.sub}, ${bill.bill_id}, 'pending', ${finalAmount}, ${couponCode || null})
      `;
    } catch (e) {
      console.warn('Could not save pending subscription:', e);
    }

    return NextResponse.json({
      bill_id: bill.bill_id,
      amount: bill.amount,
      plan,
      payment_url: bill.payment_url,
      qr_data: bill.qr_data,
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

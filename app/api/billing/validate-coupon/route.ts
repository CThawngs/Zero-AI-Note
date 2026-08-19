import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { validateCouponForPlan } from '@/lib/neon/queries';
import { applyCouponDiscount } from '@/lib/billing/coupon';

export const runtime = 'nodejs';

/**
 * POST /api/billing/validate-coupon — Read-only coupon validation for current user.
 *
 * CHECKS: active status, usage limit, expiry, plan eligibility (applies_to).
 * MUTATION: NONE. The coupon's usage_count is incremented only when a real
 * bill is created (see /api/billing/create-invoice). Previously this endpoint
 * incremented usage_count, which silently consumed coupons on mere validation.
 *
 * Returns: coupon details + computed base/final/discount amounts if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { couponCode, plan } = body as {
      couponCode?: string;
      plan?: 'pro' | 'ultra';
    };

    if (!couponCode || !couponCode.trim()) {
      return NextResponse.json({ valid: false, error: 'Coupon code is required' }, { status: 400 });
    }

    if (!plan || (plan !== 'pro' && plan !== 'ultra')) {
      return NextResponse.json({ valid: false, error: 'Valid plan (pro/ultra) is required' }, { status: 400 });
    }

    const coupon = await validateCouponForPlan(couponCode.trim(), plan);
    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Mã giảm giá không hợp lệ hoặc đã hết hiệu lực' },
        { status: 404 }
      );
    }

    const baseAmount = plan === 'pro' ? 99000 : 199000;
    const finalAmount = applyCouponDiscount(baseAmount, coupon);
    const discountAmount = baseAmount - finalAmount;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        applies_to: coupon.applies_to,
        usage_limit: coupon.usage_limit,
        usage_count: coupon.usage_count,
        expires_at: coupon.expires_at,
        status: coupon.status,
      },
      plan,
      base_amount: baseAmount,
      final_amount: finalAmount,
      discount_amount: discountAmount,
    });
  } catch (error) {
    console.error('[POST /api/billing/validate-coupon] error:', error);
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

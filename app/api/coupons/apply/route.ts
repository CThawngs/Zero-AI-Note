import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// POST /api/coupons/apply — apply a coupon code to the logged-in user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return fail('Unauthorized', 401);
    }

    const body = await request.json();
    const { code } = body;
    if (!code) {
      return fail('Missing coupon code', 400);
    }

    const sql = getSql();
    const rows = await sql`
      select id, code, discount_type, discount_value, applies_to,
             usage_limit, usage_count, expires_at, status
      from coupons
      where code = ${String(code).toUpperCase()}
      and status = 'active'
      and (usage_limit is null or usage_count < usage_limit)
      and (expires_at is null or expires_at > now())
    `;
    const coupon = (rows as unknown as any[])[0];

    if (!coupon) {
      return fail('Coupon not found or inactive', 404);
    }

    // Increment usage count
    await sql`
      update coupons set usage_count = usage_count + 1
      where id = ${coupon.id}
    `;

    const discount = coupon.discount_type === 'percent' ? Number(coupon.discount_value) : Number(coupon.discount_value);

    return ok({
      success: true,
      discountPercent: discount,
      discountType: coupon.discount_type,
      code: coupon.code,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('applyCoupon failed:', err);
    return fail('Internal server error', 500);
  }
}
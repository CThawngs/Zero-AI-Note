import type { CouponItem } from '@/src/types';

/**
 * Pure (no DB) coupon discount calculation.
 * Kept outside the "use server" queries module because Next.js requires every
 * export of a server-action file to be an async function.
 *
 * @param baseAmount amount in VND before discount
 * @param coupon validated coupon row
 * @returns final amount, rounded, with a 1000 VND banking floor
 */
export function applyCouponDiscount(baseAmount: number, coupon: CouponItem): number {
  let final = baseAmount;
  if (coupon.discount_type === 'percent') {
    final = baseAmount * (1 - Number(coupon.discount_value) / 100);
  } else {
    final = baseAmount - Number(coupon.discount_value);
  }
  return Math.max(1000, Math.round(final));
}

import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// GET /api/admin/coupons — list all coupons (admin only)
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }
  
  try {
    const sql = getSql();
    const rows = await sql`
      select id, code, discount_type, discount_value, applies_to,
             usage_limit, usage_count, expires_at, status, created_at
      from coupons
      order by created_at desc
    `;
    return ok({ coupons: rows as unknown as any[] });
  } catch (err) {
    console.error('getCoupons failed:', err);
    return fail('Internal server error', 500);
  }
}

// POST /api/admin/coupons — create coupon (admin only)
export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }
  
  try {
    const body = await request.json();
    const { code, discount_type, discount_value, applies_to, usage_limit, expires_at, status } = body;
    
    if (!code || !discount_type || discount_value === undefined) {
      return fail('Missing required fields', 400);
    }
    
    // Normalize discount_type to match DB constraint ('percent' | 'fixed')
    const normType = discount_type === 'percentage' ? 'percent' : discount_type;
    
    const sql = getSql();
    const rows = await sql`
      insert into coupons (code, discount_type, discount_value, applies_to, usage_limit, expires_at, status)
      values (${code.toUpperCase()}, ${normType}, ${discount_value}, ${applies_to ?? 'all'}, ${usage_limit ?? null}, ${expires_at ?? null}, ${status ?? 'active'})
      returning *
    `;
    const coupon = (rows as unknown as any[])[0];
    
    return ok({ coupon });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
      return fail('Coupon code already exists', 409);
    }
    console.error('createCoupon failed:', err);
    return fail('Internal server error', 500);
  }
}

// PUT /api/admin/coupons — update coupon (admin only)
export async function PUT(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }
  
  try {
    const body = await request.json();
    const { id, code, discount_type, discount_value, applies_to, usage_limit, expires_at, status } = body;
    
    if (!id) {
      return fail('Missing coupon ID', 400);
    }
    
    const sql = getSql();
    const normType = (discount_type === 'percentage' ? 'percent' : discount_type) ?? 'percent';
    const safeCode = (code ?? '').toUpperCase();
    const safeApplies = applies_to ?? 'all';
    const safeStatus = status ?? 'active';
    
    const rows = await sql`
      update coupons set
        code = ${safeCode},
        discount_type = ${normType},
        discount_value = ${discount_value ?? 0},
        applies_to = ${safeApplies},
        usage_limit = ${usage_limit ?? null},
        expires_at = ${expires_at ?? null},
        status = ${safeStatus}
      where id = ${id}
      returning *
    `;
    const row = (rows as unknown as any[])[0];
    
    if (!row) {
      return fail('Coupon not found', 404);
    }
    
    return ok({ coupon: row });
  } catch (err) {
    console.error('updateCoupon failed:', err);
    return fail('Internal server error', 500);
  }
}

// DELETE /api/admin/coupons — delete coupon (admin only)
export async function DELETE(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }
  
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return fail('Missing coupon ID', 400);
    }
    
    const sql = getSql();
    await sql`delete from coupons where id = ${id}`;
    
    return ok({ success: true });
  } catch (err) {
    console.error('deleteCoupon failed:', err);
    return fail('Internal server error', 500);
  }
}
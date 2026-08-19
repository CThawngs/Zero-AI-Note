import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

function sanitizeCouponInput(body: any) {
  const code = (body.code ?? '').trim().toUpperCase();
  const discount_type = 'percent'; // Discount Type is ALWAYS percentage (%)
  
  const rawVal = Number(body.discount_value);
  const discount_value = isNaN(rawVal) ? 10 : Math.min(100, Math.max(1, Math.round(rawVal)));
  
  let applies_to = body.applies_to ?? 'all';
  if (applies_to !== 'all' && applies_to !== 'paid') {
    applies_to = 'all';
  }

  let usage_limit: number | null = null;
  if (body.usage_limit !== null && body.usage_limit !== undefined && String(body.usage_limit).trim() !== '') {
    const parsedLimit = parseInt(String(body.usage_limit).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      usage_limit = Math.min(2147483647, parsedLimit);
    }
  }

  let expires_at: string | null = null;
  if (body.expires_at && typeof body.expires_at === 'string' && body.expires_at.trim()) {
    const raw = body.expires_at.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/');
      expires_at = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T23:59:59Z`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      expires_at = `${raw}T23:59:59Z`;
    } else {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        expires_at = d.toISOString();
      }
    }
  }

  let status = body.status ?? 'active';
  if (!['active', 'disabled', 'expired'].includes(status)) {
    status = 'active';
  }

  return { code, discount_type, discount_value, applies_to, usage_limit, expires_at, status };
}

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
    return fail(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

// POST /api/admin/coupons — create coupon (admin only)
export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }
  
  try {
    const body = await request.json();
    const clean = sanitizeCouponInput(body);
    
    if (!clean.code) {
      return fail('Coupon code is required', 400);
    }
    
    const sql = getSql();
    const rows = await sql`
      insert into coupons (code, discount_type, discount_value, applies_to, usage_limit, expires_at, status)
      values (${clean.code}, ${clean.discount_type}, ${clean.discount_value}, ${clean.applies_to}, ${clean.usage_limit}, ${clean.expires_at}, ${clean.status})
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
    return fail(msg || 'Internal server error', 500);
  }
}

// PUT /api/admin/coupons — update coupon (admin only)
export async function PUT(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }
  
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return fail('Missing coupon ID', 400);
    }
    
    const clean = sanitizeCouponInput(body);
    const sql = getSql();
    
    const rows = await sql`
      update coupons set
        code = ${clean.code},
        discount_type = ${clean.discount_type},
        discount_value = ${clean.discount_value},
        applies_to = ${clean.applies_to},
        usage_limit = ${clean.usage_limit},
        expires_at = ${clean.expires_at},
        status = ${clean.status}
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
    return fail(err instanceof Error ? err.message : 'Internal server error', 500);
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
    return fail(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
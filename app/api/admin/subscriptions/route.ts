import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// GET /api/admin/subscriptions — List all transactions and subscriptions
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const planFilter = searchParams.get('plan') || 'all';
    const query = (searchParams.get('q') || '').trim();

    const sql = getSql();

    const subscriptions = (await sql`
      select 
        s.id,
        s.user_id,
        s.bill_id,
        s.plan,
        s.amount,
        s.status,
        s.coupon_code,
        s.qr_data,
        s.paid_at,
        s.renews_at,
        s.created_at,
        p.email as user_email,
        p.display_name as user_name
      from subscriptions s
      left join profiles p on s.user_id = p.id
      where 1=1
        ${statusFilter !== 'all' ? sql`and s.status = ${statusFilter}` : sql``}
        ${planFilter !== 'all' ? sql`and s.plan = ${planFilter}` : sql``}
        ${query ? sql`and (p.email ilike ${'%' + query + '%'} or s.bill_id ilike ${'%' + query + '%'} or s.coupon_code ilike ${'%' + query + '%'})` : sql``}
      order by s.created_at desc
      limit 100
    `) as any[];

    return ok({ subscriptions });
  } catch (err) {
    console.error('[Admin Subscriptions] Error fetching subscriptions:', err);
    return fail('Internal server error', 500);
  }
}

// PUT /api/admin/subscriptions — Manually update subscription status
export async function PUT(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const body = await request.json();
    const { subscriptionId, status } = body;

    if (!subscriptionId || !status) {
      return fail('Missing subscriptionId or status', 400);
    }

    const sql = getSql();

    const rows = (await sql`
      update subscriptions
      set 
        status = ${status},
        paid_at = ${status === 'paid' ? sql`coalesce(paid_at, now())` : sql`paid_at`},
        renews_at = ${status === 'paid' ? sql`coalesce(renews_at, now() + interval '30 days')` : sql`renews_at`}
      where id = ${subscriptionId}
      returning *
    `) as any[];

    if (!rows || rows.length === 0) {
      return fail('Subscription not found', 404);
    }

    const sub = rows[0];

    // If marked paid, also update user profile plan
    if (status === 'paid' && sub.user_id && sub.plan) {
      await sql`
        update profiles
        set plan = ${sub.plan}, plan_renews_at = ${sub.renews_at || sql`now() + interval '30 days'`}
        where id = ${sub.user_id}
      `;
    }

    return ok({ subscription: sub });
  } catch (err) {
    console.error('[Admin Subscriptions] Error updating subscription:', err);
    return fail('Internal server error', 500);
  }
}

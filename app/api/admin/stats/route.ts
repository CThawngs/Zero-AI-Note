import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// GET /api/admin/stats — Real-time metrics for Admin Dashboard
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const sql = getSql();

    // 1. User metrics
    const userStats = (await sql`
      select 
        count(*)::int as total_users,
        count(*) filter (where plan = 'free')::int as free_users,
        count(*) filter (where plan = 'pro')::int as pro_users,
        count(*) filter (where plan = 'ultra')::int as ultra_users,
        count(*) filter (where role = 'admin')::int as admin_users
      from profiles
    `) as any[];

    // 2. Revenue & Subscription metrics
    const subStats = (await sql`
      select 
        count(*)::int as total_transactions,
        count(*) filter (where status = 'paid' or status = 'active')::int as paid_subscriptions,
        coalesce(sum(amount) filter (where status = 'paid' or status = 'active'), 0)::numeric as total_revenue
      from subscriptions
    `) as any[];

    // 3. Notes & Content metrics
    const noteStats = (await sql`
      select 
        count(*)::int as total_notes,
        count(*) filter (where created_at > now() - interval '24 hours')::int as notes_today,
        count(*) filter (where created_at > now() - interval '7 days')::int as notes_this_week
      from notes
    `) as any[];

    // 4. Coupons metrics
    const couponStats = (await sql`
      select 
        count(*)::int as total_coupons,
        count(*) filter (where status = 'active')::int as active_coupons,
        coalesce(sum(usage_count), 0)::int as total_redemptions
      from coupons
    `) as any[];

    // 5. Recent Subscriptions
    const recentSubs = (await sql`
      select 
        s.id, s.bill_id, s.plan, s.amount, s.status, s.coupon_code, s.paid_at, s.created_at,
        p.email as user_email, p.display_name as user_name
      from subscriptions s
      left join profiles p on s.user_id = p.id
      order by s.created_at desc
      limit 8
    `) as any[];

    // 6. Recent Users
    const recentUsers = (await sql`
      select 
        id, email, display_name, role, plan, created_at
      from profiles
      order by created_at desc
      limit 8
    `) as any[];

    return ok({
      users: userStats[0] || { total_users: 0, free_users: 0, pro_users: 0, ultra_users: 0, admin_users: 0 },
      revenue: subStats[0] || { total_transactions: 0, paid_subscriptions: 0, total_revenue: 0 },
      notes: noteStats[0] || { total_notes: 0, notes_today: 0, notes_this_week: 0 },
      coupons: couponStats[0] || { total_coupons: 0, active_coupons: 0, total_redemptions: 0 },
      recentSubscriptions: recentSubs,
      recentUsers: recentUsers,
    });
  } catch (err) {
    console.error('[Admin Stats] Error fetching metrics:', err);
    return fail('Internal server error', 500);
  }
}

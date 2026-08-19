import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// GET /api/admin/users — List user accounts with filters
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const planFilter = searchParams.get('plan') || 'all';
    const roleFilter = searchParams.get('role') || 'all';

    const sql = getSql();

    // Query profiles with note counts
    const users = (await sql`
      select 
        p.id, 
        p.email, 
        p.display_name, 
        p.role, 
        p.plan, 
        p.plan_renews_at, 
        p.created_at,
        count(n.id)::int as note_count
      from profiles p
      left join notes n on n.user_id = p.id
      where 1=1
        ${query ? sql`and (p.email ilike ${'%' + query + '%'} or p.display_name ilike ${'%' + query + '%'})` : sql``}
        ${planFilter !== 'all' ? sql`and p.plan = ${planFilter}` : sql``}
        ${roleFilter !== 'all' ? sql`and p.role = ${roleFilter}` : sql``}
      group by p.id
      order by p.created_at desc
      limit 100
    `) as any[];

    return ok({ users });
  } catch (err) {
    console.error('[Admin Users] Error fetching users:', err);
    return fail('Internal server error', 500);
  }
}

// PUT /api/admin/users — Update a user's role or plan
export async function PUT(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const body = await request.json();
    const { userId, role, plan } = body;

    if (!userId) {
      return fail('Missing userId', 400);
    }

    const sql = getSql();

    const updateFields: any = {};
    if (role && (role === 'user' || role === 'admin')) {
      updateFields.role = role;
    }
    if (plan && (plan === 'free' || plan === 'pro' || plan === 'ultra')) {
      updateFields.plan = plan;
    }

    const rows = (await sql`
      update profiles
      set 
        role = coalesce(${role || null}, role),
        plan = coalesce(${plan || null}, plan),
        plan_renews_at = ${plan === 'pro' || plan === 'ultra' ? sql`coalesce(plan_renews_at, now() + interval '30 days')` : sql`null`}
      where id = ${userId}
      returning id, email, display_name, role, plan, plan_renews_at, created_at
    `) as any[];

    if (!rows || rows.length === 0) {
      return fail('User not found', 404);
    }

    return ok({ user: rows[0] });
  } catch (err) {
    console.error('[Admin Users] Error updating user:', err);
    return fail('Internal server error', 500);
  }
}

// DELETE /api/admin/users — Delete a user
export async function DELETE(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return fail('Missing user id', 400);
    }

    const sql = getSql();
    await sql`delete from profiles where id = ${userId}`;

    return ok({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('[Admin Users] Error deleting user:', err);
    return fail('Internal server error', 500);
  }
}

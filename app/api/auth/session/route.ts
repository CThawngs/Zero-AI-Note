import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('zero_ai_note_session')?.value;
    if (!token) {
      return ok({ authenticated: false, user: null });
    }

    const session = await verifySession(token);
    if (!session) {
      return ok({ authenticated: false, user: null });
    }

    let needsPasswordSetup = false;
    let displayName = null;
    try {
      const sql = getSql();
      const rows = await sql`
        select password_hash, display_name, plan, role
        from profiles
        where id = ${session.sub} or email = ${session.email}
      `;
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0] as unknown as { password_hash: string | null; display_name: string | null; plan: string; role: string };
        needsPasswordSetup = !row.password_hash;
        displayName = row.display_name ?? null;
      }
    } catch {
      // If DB error, fallback safely
    }

    return ok({
      authenticated: true,
      user: {
        id: session.sub,
        email: session.email,
        displayName,
        role: session.role,
        plan: session.plan,
        processingMinutesUsed: session.processingMinutesUsed,
        processingMinutesLimit: session.processingMinutesLimit,
        needsPasswordSetup,
      },
    });
  } catch (error) {
    console.error('session failed:', error);
    return fail('Internal server error', 500);
  }
}
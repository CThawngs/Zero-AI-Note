import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return fail('Email and password are required', 400);
    }

    const sql = getSql();
    const rows = await sql`
      select id, email, display_name, role, plan,
             processing_minutes_used, processing_minutes_limit, password_hash
      from profiles where email = ${email.toLowerCase()}
    `;
    const first = Array.isArray(rows) ? rows[0] : rows;
    const user = first as
      | {
          id: string; email: string; display_name: string | null;
          role: string; plan: string;
          processing_minutes_used: number; processing_minutes_limit: number;
          password_hash: string;
        }
      | undefined;

    if (!user) {
      return fail('Invalid credentials', 401);
    }
    if (!user.password_hash) {
      return fail('No password set. Use OAuth or set a password first.', 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return fail('Invalid credentials', 401);
    }

    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
      plan: user.plan as 'free' | 'pro' | 'ultra',
      processingMinutesUsed: user.processing_minutes_used,
      processingMinutesLimit: user.processing_minutes_limit,
    });

    const response = ok({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        plan: user.plan,
      },
    });
    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('login failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
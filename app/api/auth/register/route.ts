import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return fail('Email and password are required', 400);
    }
    if (password.length < 8) {
      return fail('Password must be at least 8 characters', 400);
    }

    const sql = getSql();
    const exists = await sql`select id from profiles where email = ${email.toLowerCase()}`;
    if (Array.isArray(exists) && exists.length > 0) {
      return fail('Email already registered', 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    try {
      await sql`
        insert into profiles (id, email, display_name, role, plan, password_hash)
        values (${userId}, ${email.toLowerCase()}, ${displayName ?? null}, 'user', 'free', ${passwordHash})
      `;
    } catch (insertErr) {
      const msg = insertErr instanceof Error ? insertErr.message : String(insertErr);
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return fail('Email already registered', 409);
      }
      throw insertErr;
    }

    const token = await signSession({
      sub: userId,
      email: email.toLowerCase(),
      role: 'user',
      plan: 'free',
      processingMinutesUsed: 0,
      processingMinutesLimit: 120,
    });

    const response = ok({
      authenticated: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        displayName: displayName ?? null,
        role: 'user',
        plan: 'free',
      },
    });
    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('register failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
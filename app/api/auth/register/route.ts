import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'nguyenchithang2804@gmail.com').toLowerCase();

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

    const normalizedEmail = email.toLowerCase();
    const sql = getSql();
    const exists = await sql`select id from profiles where email = ${normalizedEmail}`;
    if (Array.isArray(exists) && exists.length > 0) {
      return fail('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Auto-assign admin role if email matches ADMIN_EMAIL
    const role = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'user';

    try {
      await sql`
        insert into profiles (id, email, display_name, role, plan, password_hash)
        values (${userId}, ${normalizedEmail}, ${displayName ?? null}, ${role}, 'free', ${passwordHash})
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
      email: normalizedEmail,
      role,
      plan: 'free',
      processingMinutesUsed: 0,
      processingMinutesLimit: 120,
    });

    const response = ok({
      authenticated: true,
      user: {
        id: userId,
        email: normalizedEmail,
        displayName: displayName ?? null,
        role,
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
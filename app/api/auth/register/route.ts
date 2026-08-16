import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { ok, fail } from '@/lib/auth/http';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = new TextEncoder().encode(process.env.ZERO_JWT_SECRET ?? 'dev-zero-ai-note-secret');

async function signSession(payload: { sub: string; email: string; role: string; plan: string; processingMinutesUsed: number; processingMinutesLimit: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub: string; email: string; role: string; plan: string; processingMinutesUsed: number; processingMinutesLimit: number };
  } catch {
    return null;
  }
}

function getSessionCookie(token: string) {
  return `zero_ai_note_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

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

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

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
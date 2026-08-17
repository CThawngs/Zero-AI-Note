import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'nguyenchithang2804@gmail.com').toLowerCase();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, avatar } = body;

    if (!email) {
      return fail('Google account email is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sql = getSql();

    // 1. Check if user with this email already exists in DB
    const existingRows = await sql`
      select id, email, display_name, role, plan,
             processing_minutes_used, processing_minutes_limit, password_hash
      from profiles where email = ${normalizedEmail}
    `;

    let userId: string;
    let role = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'user';
    let plan = 'free';
    let userDisplayName = displayName ?? normalizedEmail.split('@')[0];
    let processingMinutesUsed = 0;
    let processingMinutesLimit = 120;
    let hasPassword = false;

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      // ── MERGE / LINK ACCOUNT ──
      // User already exists (either created via email/password or prior Google login).
      // Reuse existing account to guarantee 1 email = 1 account.
      const existingUser = existingRows[0];
      userId = existingUser.id;
      role = existingUser.role ?? role;
      plan = existingUser.plan ?? plan;
      userDisplayName = existingUser.display_name || userDisplayName;
      processingMinutesUsed = existingUser.processing_minutes_used ?? 0;
      processingMinutesLimit = existingUser.processing_minutes_limit ?? 120;
      hasPassword = Boolean(existingUser.password_hash);
    } else {
      // ── CREATE NEW USER VIA GOOGLE ──
      userId = uuidv4();
      hasPassword = false; // Google signup has no password yet

      await sql`
        insert into profiles (id, email, display_name, role, plan, password_hash, processing_minutes_used, processing_minutes_limit)
        values (${userId}, ${normalizedEmail}, ${userDisplayName}, ${role}, 'free', null, 0, 120)
      `;
    }

    // Generate session JWT token
    const token = await signSession({
      sub: userId,
      email: normalizedEmail,
      role: role as 'user' | 'admin',
      plan: plan as 'free' | 'pro' | 'ultra',
      processingMinutesUsed,
      processingMinutesLimit,
    });

    const response = ok({
      authenticated: true,
      user: {
        id: userId,
        email: normalizedEmail,
        displayName: userDisplayName,
        role,
        plan,
        needsPasswordSetup: !hasPassword, // True if user doesn't have a password yet
      },
    });

    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Google auth failed:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

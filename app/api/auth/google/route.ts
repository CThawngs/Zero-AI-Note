import { NextRequest, NextResponse } from 'next/server';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail, createUser } from '@/lib/auth/users';

export const runtime = 'nodejs';

function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf-8')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let email = body.email;
    let displayName = body.displayName;

    // Support official Google Identity Services credential token
    if (body.credential) {
      const payload = decodeJwtPayload(body.credential);
      if (payload) {
        if (payload.email) email = payload.email;
        if (payload.name) displayName = payload.name;
      }
    }

    if (!email) {
      return fail('Google account email is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists in DB (Account Merging)
    let user = await findUserByEmail(normalizedEmail);
    let needsPasswordSetup = false;

    if (user) {
      // ── MERGE EXISTING ACCOUNT ──
      // User exists from manual registration or previous login.
      // If user already has a password set, they won't be prompted to set password again.
      needsPasswordSetup = !user.password_hash;
    } else {
      // ── CREATE NEW USER VIA GOOGLE ──
      // New Google user has no password yet (must set password upon entering dashboard).
      user = await createUser({
        email: normalizedEmail,
        displayName: displayName ?? normalizedEmail.split('@')[0],
        passwordHash: null,
      });
      needsPasswordSetup = true;
    }

    // 2. Sign JWT session token
    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
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
        needsPasswordSetup, // True only if no password has ever been set
      },
    });

    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Google auth failed:', error);
    return fail('Internal server error', 500);
  }
}

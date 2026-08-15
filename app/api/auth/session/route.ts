import { NextRequest, NextResponse } from 'next/server';
import { sql, getPool } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signSession, verifySession, getSessionCookie, clearSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('zero_ai_note_session')?.value;
  if (!token) {
    return ok({ authenticated: false, user: null });
  }

  const session = await verifySession(token);
  if (!session) {
    return ok({ authenticated: false, user: null });
  }

  return ok({
    authenticated: true,
    user: {
      id: session.sub,
      email: session.email,
      role: session.role,
      plan: session.plan,
      processingMinutesUsed: session.processingMinutesUsed,
      processingMinutesLimit: session.processingMinutesLimit,
    },
  });
}
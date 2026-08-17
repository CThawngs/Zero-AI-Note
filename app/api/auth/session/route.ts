import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserById } from '@/lib/auth/users';

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
      const user = await findUserById(session.sub);
      if (user) {
        needsPasswordSetup = !user.password_hash;
        displayName = user.display_name;
      }
    } catch {
      // Fallback
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
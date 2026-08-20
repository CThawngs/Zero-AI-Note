import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserById } from '@/lib/auth/users';
import { Plan } from '@/lib/auth/types';

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

    let displayName = null;
    let freshPlan: Plan | null = null;
    try {
      const user = await findUserById(session.sub);
      if (user) {
        displayName = user.display_name;
        freshPlan = user.plan; // Use fresh plan from DB, not stale JWT
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
        plan: freshPlan || session.plan, // Prefer fresh DB plan over JWT
        processingMinutesUsed: session.processingMinutesUsed,
        processingMinutesLimit: session.processingMinutesLimit,
        needsPasswordSetup: false,
      },
    });
  } catch (error) {
    console.error('session failed:', error);
    return fail('Internal server error', 500);
  }
}
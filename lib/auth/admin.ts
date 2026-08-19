import { verifySession } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'nguyenchithang2804@gmail.com';

/**
 * Check if the current session user is an admin.
 * Uses ADMIN_EMAIL environment variable for the hardcoded admin email.
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get('zero_ai_note_session')?.value;
  if (!sessionToken) return false;
  
  const session = await verifySession(sessionToken);
  if (!session) return false;
  
  // Check both role or email for defense-in-depth
  return session.role === 'admin' || isAdminEmail(session.email);
}

/**
 * Get the admin email from environment variable.
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}

/**
 * Check if an email is the admin email.
 */
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

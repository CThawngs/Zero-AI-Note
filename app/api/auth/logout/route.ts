import { NextRequest, NextResponse } from 'next/server';
import { ok } from '@/lib/auth/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const response = ok({ success: true, message: 'Logged out successfully' });
  
  // Clear the session cookie
  response.headers.set(
    'Set-Cookie',
    'zero_ai_note_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
  
  return response;
}

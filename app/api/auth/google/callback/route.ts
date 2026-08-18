import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { findUserByEmail, createUser } from '@/lib/auth/users';

export const runtime = 'nodejs';

function getRedirectContext(request: NextRequest): { baseUrl: string; redirectUri: string } {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  
  let baseUrl = `${proto}://${host}`;
  if (host.includes('zero-ai-note.vercel.app')) {
    baseUrl = 'https://zero-ai-note.vercel.app';
  }

  return {
    baseUrl,
    redirectUri: `${baseUrl}/api/auth/google/callback`,
  };
}

export async function GET(request: NextRequest) {
  const { baseUrl, redirectUri } = getRedirectContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('[Google OAuth Callback] Access denied by user or Google error:', error);
      return NextResponse.redirect(`${baseUrl}/?error=google_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/?error=missing_code`);
    }

    const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

    if (!clientId) {
      console.error('[Google OAuth Callback] Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
      return NextResponse.redirect(`${baseUrl}/?error=missing_client_id`);
    }

    // Exchange authorization code for tokens
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error('No id_token received in token exchange from Google');
    }

    // Verify ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Payload does not contain valid email');
    }

    const email = payload.email.toLowerCase().trim();
    const displayName = payload.name ?? email.split('@')[0];

    // Find or create user in Neon Postgres
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({
        email,
        displayName,
        passwordHash: null,
      });
    }

    // Sign session JWT
    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      processingMinutesUsed: user.processing_minutes_used,
      processingMinutesLimit: user.processing_minutes_limit,
    });

    const response = NextResponse.redirect(`${baseUrl}/app`);
    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (err) {
    console.error('[Google OAuth Callback] OAuth exchange error:', err);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}

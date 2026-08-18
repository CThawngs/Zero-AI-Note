import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getRedirectUri(request: NextRequest): string {
  // Ưu tiên NEXT_PUBLIC_APP_URL — deterministic, khớp tuyệt đối với Authorized redirect URIs
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '');
  if (appUrl) {
    return `${appUrl}/api/auth/google/callback`;
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  
  let baseUrl = `${proto}://${host}`;
  // Normalize production domain if on Vercel
  if (host.includes('zero-ai-note.vercel.app')) {
    baseUrl = 'https://zero-ai-note.vercel.app';
  }

  return `${baseUrl}/api/auth/google/callback`;
}

export async function GET(request: NextRequest) {
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth chưa được cấu hình Client ID' },
      { status: 500 }
    );
  }

  const redirectUri = getRedirectUri(request);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}

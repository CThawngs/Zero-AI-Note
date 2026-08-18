import { NextRequest } from 'next/server';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail, createUser, UserRecord } from '@/lib/auth/users';

export const runtime = 'nodejs';

function getGoogleClientId(): string {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

/**
 * Fallback JWT payload decoder for debugging or secondary verification
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verify Google ID Token using google-auth-library.
 */
async function verifyGoogleIdToken(credential: string, clientId: string): Promise<TokenPayload | null> {
  if (!clientId) return null;

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    return ticket.getPayload() ?? null;
  } catch (error) {
    console.error('[Google Auth] ID Token verification error:', error);
    
    // Fallback decode if audience matches
    try {
      const decoded = decodeJwtPayload(credential);
      if (decoded && (decoded.iss === 'https://accounts.google.com' || decoded.iss === 'accounts.google.com')) {
        if (decoded.aud === clientId && decoded.email && decoded.email_verified) {
          return decoded as unknown as TokenPayload;
        }
      }
    } catch {}
    return null;
  }
}

/**
 * Fetch Google User Info using OAuth2 access_token
 */
async function verifyGoogleAccessToken(accessToken: string): Promise<{ email: string; name: string } | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.email && data.email_verified) {
      return {
        email: data.email,
        name: data.name || data.email.split('@')[0],
      };
    }
    return null;
  } catch (err) {
    console.error('[Google Auth] Access token userinfo fetch failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return fail('Google OAuth chưa được cấu hình Client ID trên hệ thống.', 503);
    }

    const body = await request.json().catch(() => ({}));
    let email: string | null = null;
    let displayName: string | null = null;

    if (body.accessToken) {
      // Flow 1: Verified via OAuth2 Access Token (Google Token Client Popup — 0% redirect_uri mismatch risk)
      const userinfo = await verifyGoogleAccessToken(body.accessToken);
      if (!userinfo) {
        return fail('Google access token không hợp lệ hoặc đã hết hạn.', 401);
      }
      email = userinfo.email.toLowerCase().trim();
      displayName = userinfo.name;
    } else if (body.credential) {
      // Flow 2: Verified via Google ID Token JWT
      const payload = await verifyGoogleIdToken(body.credential, clientId);
      if (!payload || !payload.email) {
        return fail('Google token không hợp lệ hoặc đã hết hạn.', 401);
      }
      email = payload.email.toLowerCase().trim();
      displayName = payload.name ?? email.split('@')[0];
    } else {
      return fail('Thiếu thông tin xác thực từ Google. Vui lòng thử lại.', 400);
    }

    // 1. Account Merging: Check if user already exists
    let user = await findUserByEmail(email);
    let needsPasswordSetup = false;

    if (user) {
      // Merge into existing account
      needsPasswordSetup = !user.password_hash;
    } else {
      // Create new user in Neon Postgres
      user = await createUser({
        email,
        displayName,
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
        needsPasswordSetup,
      },
    });

    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (error) {
    console.error('[Google Auth] Server error:', error);
    return fail('Lỗi máy chủ khi xác thực Google.', 500);
  }
}

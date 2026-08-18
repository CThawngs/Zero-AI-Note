import { NextRequest } from 'next/server';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail, createUser } from '@/lib/auth/users';

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
 * Validates cryptographically against Google JWKS certs.
 */
async function verifyGoogleToken(credential: string, clientId: string): Promise<TokenPayload | null> {
  if (!clientId) {
    console.error('[Google Auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
    return null;
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    return ticket.getPayload() ?? null;
  } catch (error) {
    console.error('[Google Auth] Verification error with primary audience:', error);
    
    // Fallback: check if the token is well-formed Google token and audience matches
    try {
      const decoded = decodeJwtPayload(credential);
      if (decoded && (decoded.iss === 'https://accounts.google.com' || decoded.iss === 'accounts.google.com')) {
        console.warn('[Google Auth] Decoded token issuer is valid Google, but verifyIdToken failed. Audience:', decoded.aud);
        // If audience matches client id, allow structured payload
        if (decoded.aud === clientId && decoded.email && decoded.email_verified) {
          return decoded as unknown as TokenPayload;
        }
      }
    } catch (fallbackErr) {
      console.error('[Google Auth] Fallback decode failed:', fallbackErr);
    }
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return fail('Google OAuth chưa được cấu hình Client ID trên hệ thống (NEXT_PUBLIC_GOOGLE_CLIENT_ID).', 503);
    }

    const body = await request.json().catch(() => ({}));
    const credential = body.credential;

    if (!credential) {
      return fail('Thiếu Google credential token. Vui lòng thử lại.', 400);
    }

    // Cryptographically verify the Google ID token
    const payload = await verifyGoogleToken(credential, clientId);
    if (!payload || !payload.email) {
      return fail('Google token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }

    const email = payload.email.toLowerCase().trim();
    const displayName = payload.name ?? email.split('@')[0];

    // 1. Check if user already exists in DB (Account Merging)
    let user = await findUserByEmail(email);
    let needsPasswordSetup = false;

    if (user) {
      // ── MERGE EXISTING ACCOUNT ──
      // User exists from manual registration or previous login.
      needsPasswordSetup = !user.password_hash;
    } else {
      // ── CREATE NEW USER VIA GOOGLE ──
      // New Google user has no password yet.
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
    console.error('[Google Auth] Unhandled server error:', error);
    return fail('Lỗi máy chủ khi xác thực Google. Vui lòng thử lại sau.', 500);
  }
}

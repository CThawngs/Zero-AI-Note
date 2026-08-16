import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionPayload, COOKIE_NAME, SESSION_TTL_SECONDS } from './types';

// Fail-closed: KHÔNG dùng fallback secret trong production.
// ZERO_JWT_SECRET là bắt buộc (set ở Vercel/Neon env). Nếu thiếu, auth sẽ báo lỗi
// thay vì âm thầm dùng secret mặc định (vốn đã public do nằm trong repo).
function getJwtSecret(): Uint8Array {
  const secret = process.env.ZERO_JWT_SECRET;
  if (!secret) {
    throw new Error('ZERO_JWT_SECRET is not set. Configure it in environment variables.');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload as unknown as import('jose').JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(getJwtSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySession(token);
}

export function getSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
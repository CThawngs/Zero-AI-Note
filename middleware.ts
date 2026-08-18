import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/docs',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/session',
  '/api/health',
  '/api/coupons/apply'
];

const ADMIN_ROUTES = [
  '/admin-coupons'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check session for redirect logic
  const sessionToken = request.cookies.get('zero_ai_note_session')?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;

  // Root "/" — landing page: public, but redirect to /app if already logged in
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
  }

  // Static assets & other public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Admin routes require admin role
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // /app is now public — login/register screens handled by AppContext
  // (previous login requirement removed per landing page UX update)

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
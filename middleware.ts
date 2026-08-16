import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/docs',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/health'
];

const ADMIN_ROUTES = [
  '/admin-coupons'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check session
  const sessionToken = request.cookies.get('zero_ai_note_session')?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  
  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check admin routes
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }
  
  // Redirect to dashboard if already logged in and trying to access login/register
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
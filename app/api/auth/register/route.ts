import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail, createUser } from '@/lib/auth/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return fail('Email and password are required', 400);
    }
    if (password.length < 8) {
      return fail('Password must be at least 8 characters', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return fail('Địa chỉ email này đã được đăng ký tài khoản trước đó rồi. Vui lòng chuyển sang Đăng nhập.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email: normalizedEmail,
      displayName: displayName ?? null,
      passwordHash,
    });

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
        needsPasswordSetup: false,
      },
    });
    response.headers.set('Set-Cookie', getSessionCookie(token));
    return response;
  } catch (error) {
    console.error('register failed:', error);
    return fail('Internal server error', 500);
  }
}
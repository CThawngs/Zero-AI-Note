import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail } from '@/lib/auth/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return fail('Email và mật khẩu không được để trống', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return fail('Email hoặc mật khẩu không chính xác', 401);
    }

    if (!user.password_hash) {
      return fail('Tài khoản này chưa tạo mật khẩu. Vui lòng đăng nhập bằng Google hoặc thiết lập mật khẩu.', 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return fail('Email hoặc mật khẩu không chính xác', 401);
    }

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
    console.error('login failed:', error);
    return fail('Internal server error', 500);
  }
}

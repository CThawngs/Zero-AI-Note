import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyPassword } from '@/lib/auth/password';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail, updateUserPassword } from '@/lib/auth/users';

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

    // ── HỢP NHẤT TÀI KHOẢN (ACCOUNT MERGING) ──
    // Nếu tài khoản được tạo qua Google và chưa đặt mật khẩu:
    // Tự động gán mật khẩu người dùng vừa nhập và đăng nhập thành công.
    if (!user.password_hash) {
      if (password.length >= 8) {
        const passwordHash = await bcrypt.hash(password, 10);
        await updateUserPassword(user.id, passwordHash);
        user.password_hash = passwordHash;
      } else {
        return fail('Tài khoản này được đăng ký qua Google. Vui lòng nhập mật khẩu ≥ 8 ký tự để liên kết hoặc đăng nhập bằng Google.', 401);
      }
    } else {
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return fail('Email hoặc mật khẩu không chính xác', 401);
      }
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
    console.error('Login failed:', error);
    return fail('Lỗi máy chủ khi đăng nhập', 500);
  }
}

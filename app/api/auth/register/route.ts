import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { signSession, getSessionCookie } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { findUserByEmail, createUser, updateUserPassword, UserRecord } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return fail('Email và mật khẩu không được để trống', 400);
    }
    if (password.length < 8) {
      return fail('Mật khẩu phải có ít nhất 8 ký tự', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1 email = 1 ID duy nhất. Kiểm tra xem email đã tồn tại hay chưa
    const existing = await findUserByEmail(normalizedEmail);
    let user: UserRecord;

    if (existing) {
      // Nếu tài khoản đã đăng ký mật khẩu trước đó -> Báo lỗi không cho tạo trùng
      if (existing.password_hash) {
        return fail(
          'Địa chỉ email này đã được đăng ký tài khoản trước đó. Vui lòng đăng nhập hoặc sử dụng tính năng Quên mật khẩu.',
          409
        );
      }

      // HỢP NHẤT TÀI KHOẢN (ACCOUNT MERGING):
      // Nếu tài khoản đã tồn tại qua Google (chưa thiết lập mật khẩu) -> Hợp nhất bằng cách cập nhật mật khẩu cho tài khoản Google đó
      const passwordHash = await bcrypt.hash(password, 10);
      await updateUserPassword(existing.id, passwordHash);
      existing.password_hash = passwordHash;
      user = existing;
    } else {
      // Tạo tài khoản mới hoàn toàn
      const passwordHash = await bcrypt.hash(password, 10);
      user = await createUser({
        email: normalizedEmail,
        displayName: displayName ?? null,
        passwordHash,
      });
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
    console.error('Register/merge failed:', error);
    return fail('Lỗi máy chủ khi đăng ký tài khoản', 500);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';
import { ok, fail } from '@/lib/auth/http';
import { updateUserPassword } from '@/lib/auth/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('zero_ai_note_session')?.value;
    if (!token) {
      return fail('Unauthorized. Please log in first.', 401);
    }

    const session = await verifySession(token);
    if (!session) {
      return fail('Invalid session. Please log in again.', 401);
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return fail('Mật khẩu không được để trống', 400);
    }
    if (password.length < 8) {
      return fail('Mật khẩu phải có ít nhất 8 ký tự', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(session.sub, passwordHash);

    return ok({
      success: true,
      message: 'Mật khẩu đã được thiết lập thành công!',
    });
  } catch (error) {
    console.error('set-password failed:', error);
    return fail('Internal server error', 500);
  }
}

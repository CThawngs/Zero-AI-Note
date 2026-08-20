import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getZeroInvoiceBaseUrl, checkZeroInvoiceBillStatus } from '@/lib/billing/zeroinvoice';

export const runtime = 'nodejs';

/**
 * POST /api/billing/confirm — Submit Payment Verification Request
 * 
 * Khách hàng bấm gửi yêu cầu xác nhận chuyển khoản cho ngân hàng thủ công.
 * 1. Kiểm tra xem bill đã được PayOS hoặc hệ thống đánh dấu 'paid' chưa.
 * 2. Nếu chưa, gửi verify-request sang Zero Tracking để chuyển status -> 'verifying' (Chờ duyệt).
 * 3. Tuyệt đối KHÔNG tự ý nâng cấp tài khoản khi chưa có xác nhận từ ngân hàng hoặc chủ shop.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billId, plan } = body as { billId?: string; plan?: 'pro' | 'ultra' };

    if (!billId) {
      return NextResponse.json({ error: 'Missing billId' }, { status: 400 });
    }

    const ZT_BASE = getZeroInvoiceBaseUrl();

    // 1) Kiểm tra trạng thái hiện tại trên Zero Tracking
    const currentBill = await checkZeroInvoiceBillStatus(billId);
    if (currentBill.status === 'paid' || currentBill.status === 'resolved') {
      return NextResponse.json({
        ok: true,
        isPaid: true,
        status: 'paid',
        plan: plan || 'pro',
      });
    }

    // 2) Gửi yêu cầu xác nhận sang Zero Tracking (chuyển sang 'verifying')
    try {
      await fetch(`${ZT_BASE}/api/bills/${billId}/verify-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.sub,
          note: `Khách hàng gửi yêu cầu xác nhận gói ${plan || 'pro'}`,
        }),
      });
    } catch (e) {
      console.warn('[billing/confirm] Zero Tracking verify-request notice:', e);
    }

    return NextResponse.json({
      ok: true,
      isPaid: false,
      status: 'verifying',
      message: 'Yêu cầu của bạn đã được gửi. Chủ hệ thống sẽ kiểm tra và kích hoạt đơn.',
    });
  } catch (error) {
    console.error('[POST /api/billing/confirm] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

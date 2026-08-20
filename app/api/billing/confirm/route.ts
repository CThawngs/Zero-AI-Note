import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSql } from '@/lib/db';
import { upgradeUserPlan } from '@/lib/neon/queries';
import { checkZeroInvoiceBillStatus } from '@/lib/billing/zeroinvoice';

export const runtime = 'nodejs';

/**
 * POST /api/billing/confirm — Kiểm tra và xác thực trạng thái thanh toán từ ngân hàng
 *
 * User bấm "Tôi đã chuyển tiền thành công".
 * Backend truy vấn trạng thái thực tế của bill trên Zero Tracking.
 * CHỈ NÂNG CẤP KHI VÀ CHỈ KHI bill đã có trạng thái 'paid' (do Bank Webhook hoặc Bank Sync ghi nhận).
 * Tuyệt đối không cho phép tự ý chuyển status sang 'paid' khi chưa nhận được tiền từ ngân hàng.
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

    // Kiểm tra trạng thái thực tế của bill từ Zero Tracking
    const billStatus = await checkZeroInvoiceBillStatus(billId);
    const isPaid = billStatus.status === 'paid' || billStatus.status === 'resolved';

    if (!isPaid) {
      return NextResponse.json({
        ok: false,
        isPaid: false,
        status: billStatus.status,
        error: 'Chưa nhận được thông báo chuyển tiền từ ngân hàng cho đơn hàng này. Vui lòng quét mã VietQR và thử lại sau ít giây.',
      }, { status: 200 });
    }

    // Nếu đã thanh toán thật -> cập nhật quyền lợi cho user
    const targetPlan = plan || 'pro';
    await upgradeUserPlan(session.sub, targetPlan, billId, billStatus.amount);

    try {
      const sql = getSql();
      await sql`
        update subscriptions
        set status = 'paid', paid_at = now(), renews_at = now() + interval '30 days'
        where bill_id = ${billId}
      `;
    } catch (e) {
      console.warn('Subscription record update warn:', e);
    }

    return NextResponse.json({
      ok: true,
      isPaid: true,
      status: 'paid',
      plan: targetPlan,
    });
  } catch (error) {
    console.error('[POST /api/billing/confirm] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { upgradeUserPlan } from '@/lib/neon/queries';
import { getSql } from '@/lib/db';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.ZEROINVOICE_WEBHOOK_SECRET;

/**
 * POST /api/billing/webhook — Nhận webhook thanh toán từ ZeroInvoice / VietQR
 *
 * Bảo mật: nếu đã cấu hình ZEROINVOICE_WEBHOOK_SECRET → bắt buộc xác minh
 * chữ ký HMAC-SHA256 (header x-webhook-signature / x-zerinvoice-signature /
 * x-signature), chữ ký sai → 401 từ chối.
 * Nếu CHƯA cấu hình secret → fail-open (chấp nhận, log cảnh báo) để không
 * chặn luồng webhook trong giai đoạn tích hợp. Luồng chính vẫn là polling
 * qua /api/billing/check-status.
 */
export async function POST(request: NextRequest) {
  let body: any = null;

  try {
    // 1) Xác minh webhook secret — NẾU đã cấu hình
    if (WEBHOOK_SECRET) {
      const rawBody = await request.text();
      const signature =
        request.headers.get('x-webhook-signature') ||
        request.headers.get('x-zerinvoice-signature') ||
        request.headers.get('x-signature') ||
        '';

      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
      }

      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const provided = signature.toLowerCase();
      const valid =
        provided === expected ||
        provided === `sha256=${expected}` ||
        provided === `hmac sha256=${expected}`;

      if (!valid) {
        console.warn('[ZeroInvoice Webhook] Invalid signature — rejected');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      body = JSON.parse(rawBody);
    } else {
      console.warn('[ZeroInvoice Webhook] ZEROINVOICE_WEBHOOK_SECRET not configured — skipping signature verification (fail-open)');
      body = await request.json();
    }

    // 2) Xử lý
    console.log('[ZeroInvoice Webhook Received]:', body);

    // Zero Tracking gửi: { event: "bill.paid", data: { bill_id, amount, paid_at } }
    // (docs 2026-08-18). Hỗ trợ cả dạng cũ: { bill_id, status, amount } cho tương thích.
    const event = body.event || body.type || '';
    const payload = body.data && typeof body.data === 'object' ? body.data : body;

    const billId = payload.bill_id || payload.id || body.bill_id || body.id;
    const status = payload.status || body.status || event;
    const amount = payload.amount || body.amount;

    if (!billId) {
      return NextResponse.json({ error: 'Missing bill_id' }, { status: 400 });
    }

    // Trạng thái paid: event "bill.paid" hoặc status paid/resolved/...
    const isPaid =
      event === 'bill.paid' ||
      event === 'payment.completed' ||
      status === 'paid' ||
      status === 'resolved' ||
      status === 'payment.completed' ||
      status === 'bill.paid' ||
      status === 'success';

    if (isPaid) {
      const sql = getSql();
      // Look up subscription to find the user_id and target plan
      const subRows = (await sql`
        select user_id, amount, coupon_code from subscriptions
        where zeroinvoice_invoice_id = ${billId}
        limit 1
      `) as any[];

      if (subRows && subRows.length > 0) {
        const sub = subRows[0] as { user_id: string; amount: number; coupon_code?: string };
        // Determine plan based on amount or default
        const targetPlan = (amount || sub.amount) >= 150000 ? 'ultra' : 'pro';
        await upgradeUserPlan(sub.user_id, targetPlan, billId, amount || sub.amount, sub.coupon_code);

        await sql`
          update subscriptions
          set status = 'active', renews_at = now() + interval '30 days'
          where zeroinvoice_invoice_id = ${billId}
        `;
        console.log(`[ZeroInvoice Webhook] Successfully upgraded user ${sub.user_id} to ${targetPlan}`);
      }
    }

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error) {
    console.error('[ZeroInvoice Webhook Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing error' },
      { status: 500 }
    );
  }
}

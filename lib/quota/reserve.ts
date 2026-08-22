import { getSql } from '@/lib/db';

/**
 * Atomic quota reservation + 90% safety valve (PRD mục 3.2/3.3, Architecture v1 §21).
 *
 * Bảng `quotas` (schema-neon.sql #24): limit_value / consumed / reserved,
 * unique (user_id, resource_type, period_start).
 *
 * Flow: reserve → job → commit/release. SELECT ... FOR UPDATE serialise.
 */

export type QuotaResource = 'ai_tokens' | 'stt_seconds' | 'notes' | 'processing_minutes';

const SAFETY_VALVE = 0.9; // auto-pause khi quota ngày chạm 90%

function periodBounds(now = new Date()): { start: string; end: string } {
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  return { start, end };
}

/** Limit theo plan — Neurons/day: free 8k, pro 50k, ultra 200k (PRD mục 5). */
export function defaultLimit(resource: QuotaResource, plan: 'free' | 'pro' | 'ultra'): number {
  if (resource === 'ai_tokens') {
    return plan === 'ultra' ? 200_000 : plan === 'pro' ? 50_000 : 8_000;
  }
  if (resource === 'stt_seconds') {
    // STT chạy qua Gemini key hệ thống — cap theo gói chống abuse
    return plan === 'ultra' ? 14_400 : plan === 'pro' ? 7_200 : 1_800;
  }
  if (resource === 'processing_minutes') {
    return plan === 'ultra' ? 600 : plan === 'pro' ? 300 : 60;
  }
  return plan === 'ultra' ? Number.MAX_SAFE_INTEGER : plan === 'pro' ? 50 : 20; // notes
}

export interface ReserveResult {
  ok: boolean;
  consumed: number;
  reserved: number;
  limit: number;
  pausedByValve?: boolean;
  message?: string;
}

async function ensureRow(
  sql: ReturnType<typeof getSql>,
  userId: string,
  resource: QuotaResource,
  start: string,
  end: string,
  limit: number
): Promise<void> {
  await sql`
    insert into quotas (user_id, resource_type, period_start, period_end, limit_value)
    values (${userId}, ${resource}, ${start}, ${end}, ${limit})
    on conflict (user_id, resource_type, period_start) do nothing
  `;
}

/** Đặt trước n đơn vị quota cho user+resource trong ngày. */
export async function reserveQuota(
  userId: string,
  resource: QuotaResource,
  amount: number,
  plan: 'free' | 'pro' | 'ultra'
): Promise<ReserveResult> {
  const sql = getSql();
  const { start, end } = periodBounds();
  await ensureRow(sql, userId, resource, start, end, defaultLimit(resource, plan));

  const rows = (await sql`
    select limit_value, consumed, reserved
    from quotas
    where user_id = ${userId} and resource_type = ${resource} and period_start = ${start}
    for update
  `) as unknown as { limit_value: string; consumed: number; reserved: number }[];

  const q = rows[0];
  if (!q) return { ok: false, consumed: 0, reserved: 0, limit: 0, message: 'Không tạo được dòng quota.' };

  const limit = Number(q.limit_value);
  const committed = Number(q.consumed);
  const held = Number(q.reserved);

  // Safety valve 90%: pause nhận job mới khi committed+held chạm ngưỡng
  if (committed + held >= Math.floor(limit * SAFETY_VALVE)) {
    return {
      ok: false,
      consumed: committed,
      reserved: held,
      limit,
      pausedByValve: true,
      message: `Hệ thống đang quá tải tạm thời (quota đạt ${Math.round(((committed + held) / Math.max(1, limit)) * 100)}%). Vui lòng thử lại sau ít phút.`,
    };
  }

  if (limit - committed - held < amount) {
    return { ok: false, consumed: committed, reserved: held, limit, message: 'Quota còn lại không đủ cho yêu cầu này.' };
  }

  await sql`
    update quotas set reserved = reserved + ${amount}, updated_at = now()
    where user_id = ${userId} and resource_type = ${resource} and period_start = ${start}
  `;
  return { ok: true, consumed: committed, reserved: held + amount, limit };
}

/** Job thành công: chuyển reserved → consumed. */
export async function commitQuota(userId: string, resource: QuotaResource, amount: number): Promise<void> {
  const sql = getSql();
  const { start } = periodBounds();
  await sql`
    update quotas
    set consumed = consumed + ${amount},
        reserved = greatest(0, reserved - ${amount}),
        updated_at = now()
    where user_id = ${userId} and resource_type = ${resource} and period_start = ${start}
  `;
}

/** Job thất bại/hủy: trả lại phần reserved chưa dùng. */
export async function releaseQuota(userId: string, resource: QuotaResource, amount: number): Promise<void> {
  const sql = getSql();
  const { start } = periodBounds();
  await sql`
    update quotas
    set reserved = greatest(0, reserved - ${amount}), updated_at = now()
    where user_id = ${userId} and resource_type = ${resource} and period_start = ${start}
  `;
}

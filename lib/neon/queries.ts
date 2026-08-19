"use server";

import { getSql } from '@/lib/db';
import { CouponItem } from '@/src/types';
import { unstable_noStore as noStore } from 'next/cache';

// ============================================================
// NOTES CRUD
// ============================================================

export interface NoteRow {
  id: string;
  user_id: string;
  notebook_id: string | null;
  method: string | null;
  custom_template_id: string | null;
  output_language: string | null;
  content_structured: any;
  confidence_flags: any;
  created_at: string;
}

export async function purgeExpiredArchivedNotes(userId?: string): Promise<void> {
  try {
    const sql = getSql();
    if (userId) {
      await sql`delete from notes where user_id = ${userId} and deleted_at is not null and deleted_at < now() - interval '30 days'`;
    } else {
      await sql`delete from notes where deleted_at is not null and deleted_at < now() - interval '30 days'`;
    }
  } catch (e) {
    console.error('purgeExpiredArchivedNotes error:', e);
  }
}

export async function deleteAllArchivedNotes(userId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from notes where user_id = ${userId} and deleted_at is not null`;
}

export async function getNotes(userId: string): Promise<NoteRow[]> {
  noStore();
  const sql = getSql();
  await purgeExpiredArchivedNotes(userId).catch(() => {});
  const rows = await sql`
    select * from notes
    where user_id = ${userId} and deleted_at is null
    order by created_at desc
  `;
  return rows as unknown as NoteRow[];
}

export async function getArchivedNotes(userId: string): Promise<NoteRow[]> {
  noStore();
  const sql = getSql();
  await purgeExpiredArchivedNotes(userId).catch(() => {});
  const rows = await sql`
    select * from notes
    where user_id = ${userId} and deleted_at is not null
    order by deleted_at desc
  `;
  return rows as unknown as NoteRow[];
}

export async function checkNoteLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number; plan: string; message?: string }> {
  try {
    const sql = getSql();
    const profileRows = await sql`select plan from profiles where id = ${userId}`;
    const plan = ((profileRows[0]?.plan as string) || 'free').toLowerCase();
    
    const countRows = await sql`select count(*)::int as cnt from notes where user_id = ${userId} and deleted_at is null`;
    const current = Number(countRows[0]?.cnt) || 0;
    
    if (plan === 'ultra' || plan === 'admin') {
      return { allowed: true, current, limit: Infinity, plan };
    }
    
    const limit = plan === 'pro' ? 50 : 20;
    if (current >= limit) {
      const planName = plan === 'pro' ? 'Pro' : 'Miễn phí';
      const nextPlan = plan === 'pro' ? 'Ultra' : 'Pro';
      return {
        allowed: false,
        current,
        limit,
        plan,
        message: `Bạn đã đạt giới hạn tối đa ${limit} ghi chú của gói ${planName}. Vui lòng nâng cấp lên gói ${nextPlan} để tiếp tục tạo thêm ghi chú.`
      };
    }
    
    return { allowed: true, current, limit, plan };
  } catch (e) {
    console.warn('checkNoteLimit fallback allow:', e);
    return { allowed: true, current: 0, limit: 20, plan: 'free' };
  }
}

export async function createNote(input: {
  user_id: string;
  title: string;
  method: string;
  output_language: string;
  content_structured: object;
  confidence_flags: object;
}): Promise<NoteRow> {
  const limitCheck = await checkNoteLimit(input.user_id);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || `Đã vượt quá giới hạn ${limitCheck.limit} ghi chú của gói ${limitCheck.plan}.`);
  }
  const sql = getSql();
  const rows = await sql`
    insert into notes (user_id, title, method, output_language, content_structured, confidence_flags)
    values (${input.user_id}, ${input.title}, ${input.method}, ${input.output_language},
            ${JSON.stringify(input.content_structured)}, ${JSON.stringify(input.confidence_flags)})
    returning *
  `;
  return (rows as unknown as NoteRow[])[0];
}

export async function updateNote(noteId: string, updates: { title?: string }): Promise<void> {
  const sql = getSql();
  if (updates.title !== undefined) {
    await sql`update notes set title = ${updates.title} where id = ${noteId}`;
  }
}

export async function archiveNote(noteId: string): Promise<void> {
  const sql = getSql();
  await sql`update notes set deleted_at = now() where id = ${noteId}`;
}

export async function restoreNote(noteId: string): Promise<void> {
  const sql = getSql();
  await sql`update notes set deleted_at = null where id = ${noteId}`;
}

export async function deleteNotePermanently(noteId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from notes where id = ${noteId}`;
}

// ============================================================
// CUSTOM TEMPLATES CRUD & LIMITS (5 / 25 / ∞)
// ============================================================

export interface CustomTemplateRow {
  id: string;
  user_id: string;
  name: string;
  description_prompt: string;
  created_at: string;
}

export async function checkCustomTemplateLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number; plan: string; message?: string }> {
  try {
    const sql = getSql();
    const profileRows = await sql`select plan from profiles where id = ${userId}`;
    const plan = ((profileRows[0]?.plan as string) || 'free').toLowerCase();
    
    const countRows = await sql`select count(*)::int as cnt from custom_note_templates where user_id = ${userId}`;
    const current = Number(countRows[0]?.cnt) || 0;
    
    if (plan === 'ultra' || plan === 'admin') {
      return { allowed: true, current, limit: Infinity, plan };
    }
    
    const limit = plan === 'pro' ? 25 : 5;
    if (current >= limit) {
      const planName = plan === 'pro' ? 'Pro' : 'Miễn phí';
      const nextPlan = plan === 'pro' ? 'Ultra' : 'Pro';
      return {
        allowed: false,
        current,
        limit,
        plan,
        message: `Bạn đã đạt giới hạn tối đa ${limit} mẫu tùy chỉnh của gói ${planName}. Vui lòng nâng cấp lên gói ${nextPlan} để tạo thêm mẫu.`
      };
    }
    
    return { allowed: true, current, limit, plan };
  } catch (e) {
    console.warn('checkCustomTemplateLimit fallback allow:', e);
    return { allowed: true, current: 0, limit: 5, plan: 'free' };
  }
}

export async function getCustomTemplates(userId: string): Promise<CustomTemplateRow[]> {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select * from custom_note_templates
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows as unknown as CustomTemplateRow[];
}

export async function createCustomTemplate(input: {
  user_id: string;
  name: string;
  description_prompt: string;
}): Promise<CustomTemplateRow> {
  const limitCheck = await checkCustomTemplateLimit(input.user_id);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || `Đã vượt quá giới hạn ${limitCheck.limit} mẫu tùy chỉnh.`);
  }
  const sql = getSql();
  const rows = await sql`
    insert into custom_note_templates (user_id, name, description_prompt)
    values (${input.user_id}, ${input.name}, ${input.description_prompt})
    returning *
  `;
  return (rows as unknown as CustomTemplateRow[])[0];
}

export async function deleteCustomTemplate(templateId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from custom_note_templates where id = ${templateId}`;
}

// ============================================================
// SOURCES CRUD
// ============================================================

export interface SourceRow {
  id: string;
  user_id: string;
  notebook_id: string | null;
  type: string | null;
  file_url: string | null;
  original_url: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  status: string | null;
  transcript: string | null;
  created_at: string;
}

export async function getSources(userId: string): Promise<SourceRow[]> {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select * from sources
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows as unknown as SourceRow[];
}

export async function createSource(input: {
  user_id?: string;
  type: string;
  file_name: string;
  size_bytes: number;
  file_url?: string;
}): Promise<SourceRow> {
  const sql = getSql();
  const rows = await sql`
    insert into sources (user_id, type, file_name, file_url, size_bytes, status)
    values (${input.user_id}, ${input.type}, ${input.file_name}, ${input.file_url || input.file_name}, ${input.size_bytes}, 'processed')
    returning *
  `;
  return (rows as unknown as SourceRow[])[0];
}

export async function deleteSource(sourceId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from sources where id = ${sourceId}`;
}

// ============================================================
// COUPONS CRUD (Admin)
// ============================================================

export async function getCoupons(): Promise<CouponItem[]> {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select id, code, discount_type, discount_value, applies_to,
           usage_limit, usage_count, expires_at, status, created_at
    from coupons
    order by created_at desc
  `;
  return rows as unknown as CouponItem[];
}

export async function createCoupon(input: {
  code: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  usage_limit: number | null;
  expires_at: string | null;
  status: string;
}): Promise<CouponItem> {
  const sql = getSql();
  const rows = await sql`
    insert into coupons (code, discount_type, discount_value, applies_to, usage_limit, expires_at, status)
    values (${input.code}, ${input.discount_type}, ${input.discount_value},
            ${input.applies_to}, ${input.usage_limit}, ${input.expires_at}, ${input.status})
    returning *
  `;
  return (rows as unknown as CouponItem[])[0];
}

export async function updateCoupon(couponId: string, updates: Partial<Omit<CouponItem, 'id'>>): Promise<void> {
  const sql = getSql();
  if (updates.code !== undefined) {
    await sql`update coupons set code = ${updates.code} where id = ${couponId}`;
  }
  if (updates.discount_type !== undefined) {
    await sql`update coupons set discount_type = ${updates.discount_type} where id = ${couponId}`;
  }
  if (updates.discount_value !== undefined) {
    await sql`update coupons set discount_value = ${updates.discount_value} where id = ${couponId}`;
  }
  if (updates.applies_to !== undefined) {
    await sql`update coupons set applies_to = ${updates.applies_to} where id = ${couponId}`;
  }
  if (updates.usage_limit !== undefined) {
    await sql`update coupons set usage_limit = ${updates.usage_limit} where id = ${couponId}`;
  }
  if (updates.expires_at !== undefined) {
    await sql`update coupons set expires_at = ${updates.expires_at} where id = ${couponId}`;
  }
  if (updates.status !== undefined) {
    await sql`update coupons set status = ${updates.status} where id = ${couponId}`;
  }
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const sql = getSql();
  await sql`delete from coupons where id = ${couponId}`;
}

/**
 * Validate + fetch a coupon for a given plan (read-only — no mutation).
 * Checks: exists, status=active, not expired, usage limit not reached,
 * and plan eligibility (applies_to: 'all' | 'paid').
 * Returns the coupon row or null.
 */
export async function validateCouponForPlan(
  code: string,
  plan: 'free' | 'pro' | 'ultra'
): Promise<CouponItem | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, code, discount_type, discount_value, applies_to,
           usage_limit, usage_count, expires_at, status, created_at
    from coupons
    where code = ${code.trim().toUpperCase()}
  `) as CouponItem[];

  const coupon = rows[0];
  if (!coupon) return null;
  if (coupon.status !== 'active') return null;
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null;
  if (
    coupon.usage_limit !== null &&
    coupon.usage_count !== null &&
    coupon.usage_count >= coupon.usage_limit
  ) {
    return null;
  }
  // applies_to: 'paid' means pro/ultra only; 'all' always valid
  if (coupon.applies_to === 'paid' && plan === 'free') return null;
  return coupon;
}

/**
 * Atomically increment a coupon's usage_count (idempotent-ish; caller
 * should only call once per successful bill creation).
 */
export async function incrementCouponUsage(couponId: string): Promise<void> {
  const sql = getSql();
  await sql`
    update coupons set usage_count = usage_count + 1 where id = ${couponId}
  `;
}

// ============================================================
// USER PROFILE
// ============================================================

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  plan: string;
  processing_minutes_used: number;
  processing_minutes_limit: number;
}

export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select id, email, display_name, role, plan, processing_minutes_used, processing_minutes_limit
    from profiles
    where id = ${userId}
  `;
  return (rows as unknown as ProfileRow[])[0] ?? null;
}

export async function applyCouponToUser(userId: string, couponCode: string) {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select * from coupons
    where code = ${couponCode}
    and status = 'active'
    and (usage_limit is null or usage_count < usage_limit)
    and (expires_at is null or expires_at > now())
  `;

  const coupon = (rows as unknown as CouponItem[])[0];
  if (!coupon) {
    throw new Error('Coupon not found or inactive');
  }

  await sql`
    update coupons
    set usage_count = usage_count + 1
    where code = ${couponCode}
  `;

  return coupon;
}

// ============================================================
// SUBSCRIPTIONS & PLAN UPGRADES (ZeroInvoice)
// ============================================================

export async function upgradeUserPlan(
  userIdOrEmail: string,
  plan: 'free' | 'pro' | 'ultra',
  invoiceId?: string,
  amount?: number,
  couponCode?: string
): Promise<void> {
  const sql = getSql();
  // Update profiles table
  const updatedProfiles = await sql`
    update profiles
    set plan = ${plan},
        plan_renews_at = now() + interval '30 days'
    where id::text = ${userIdOrEmail} or email = ${userIdOrEmail}
    returning id
  `;

  const userId = updatedProfiles[0]?.id || userIdOrEmail;

  // Insert or record in subscriptions table if exists (schema mới: bill_id)
  try {
    await sql`
      insert into subscriptions (user_id, bill_id, plan, amount, status, coupon_code, renews_at)
      values (${userId}, ${invoiceId || null}, ${plan}, ${amount || null}, 'paid', ${couponCode || null}, now() + interval '30 days')
    `;
  } catch (e) {
    console.warn('Could not insert subscription record:', e);
  }
}
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

export async function getNotes(userId: string): Promise<NoteRow[]> {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select * from notes
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows as unknown as NoteRow[];
}

export async function getArchivedNotes(userId: string): Promise<NoteRow[]> {
  noStore();
  const sql = getSql();
  const rows = await sql`
    select * from notes
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows as unknown as NoteRow[];
}

export async function createNote(input: {
  user_id: string;
  title: string;
  method: string;
  output_language: string;
  content_structured: object;
  confidence_flags: object;
}): Promise<NoteRow> {
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
  user_id: string;
  type: string;
  file_name: string;
  size_bytes: number;
}): Promise<SourceRow> {
  const sql = getSql();
  const rows = await sql`
    insert into sources (user_id, type, file_url, size_bytes, status)
    values (${input.user_id}, ${input.type}, ${input.file_name}, ${input.size_bytes}, 'processed')
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
/**
 * API Client — cầu nối client-side tới server qua fetch API routes.
 * Thay thế hoàn toàn việc import trực tiếp server functions ("use server")
 * từ client component (nguyên nhân gây "Data loading failed" + React #441).
 *
 * Các hàm có signature TƯƠNG ĐỰƠNG với lib/neon/queries.ts để AppContext
 * không cần sửa logic, chỉ đổi import.
 */
import type { CouponItem } from '@/src/types';

// ============================================================
// Notes
// ============================================================

export async function getNotes(): Promise<any[]> {
  const res = await fetch('/api/notes', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load notes');
  }
  const data = await res.json();
  return data.notes ?? [];
}

export async function getArchivedNotes(): Promise<any[]> {
  const res = await fetch('/api/notes?archived=1', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load archived notes');
  }
  const data = await res.json();
  return data.notes ?? [];
}

export async function createNote(input: {
  user_id: string;
  title: string;
  method: string;
  output_language: string;
  content_structured: object;
  confidence_flags: object;
}): Promise<any> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create note');
  }
  const data = await res.json();
  return data.note;
}

export async function updateNote(noteId: string, updates: { title?: string }): Promise<void> {
  const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update note');
  }
}

export async function archiveNote(noteId: string): Promise<void> {
  const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to archive note');
  }
}

export async function restoreNote(noteId: string): Promise<void> {
  const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}&restore=1`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to restore note');
  }
}

export async function deleteNotePermanently(noteId: string): Promise<void> {
  const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}&permanent=1`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete note');
  }
}

// ============================================================
// Sources
// ============================================================

export async function getSources(): Promise<any[]> {
  const res = await fetch('/api/sources', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load sources');
  }
  const data = await res.json();
  return data.sources ?? [];
}

export async function createSource(input: {
  user_id: string;
  type: string;
  file_name: string;
  size_bytes: number;
}): Promise<any> {
  const res = await fetch('/api/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create source');
  }
  const data = await res.json();
  return data.source;
}

export async function deleteSource(sourceId: string): Promise<void> {
  const res = await fetch(`/api/sources?id=${encodeURIComponent(sourceId)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete source');
  }
}

// ============================================================
// Coupons (admin)
// ============================================================

export async function getCoupons(): Promise<CouponItem[]> {
  const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load coupons');
  }
  const data = await res.json();
  return data.coupons ?? [];
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
  const res = await fetch('/api/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create coupon');
  }
  const data = await res.json();
  return data.coupon;
}

export async function updateCoupon(couponId: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/admin/coupons', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: couponId, ...data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to update coupon');
  }
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(couponId)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete coupon');
  }
}

// ============================================================
// Profile
// ============================================================

export async function getUserProfile(): Promise<any | null> {
  const res = await fetch('/api/profile', { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load profile');
  }
  const data = await res.json();
  return data.profile ?? null;
}

export async function applyCouponToUser(userId: string, code: string): Promise<any> {
  const res = await fetch('/api/coupons/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to apply coupon');
  }
  const data = await res.json();
  return data;
}

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

export async function getNotes(_userId?: string): Promise<any[]> {
  const res = await fetch('/api/notes', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load notes');
  }
  const data = await res.json();
  return data.notes ?? [];
}

export async function getArchivedNotes(_userId?: string): Promise<any[]> {
  const res = await fetch('/api/notes?archived=1', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load archived notes');
  }
  const data = await res.json();
  return data.notes ?? [];
}

export async function createNote(input: {
  user_id?: string;
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
  const res = await fetch(`/api/notes/restore?id=${encodeURIComponent(noteId)}`, { method: 'POST' });
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

export async function deleteAllArchivedNotes(): Promise<void> {
  const res = await fetch('/api/notes?all=1', { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to empty trash');
  }
}

export async function purgeExpiredNotes(): Promise<void> {
  const res = await fetch('/api/notes?purgeExpired=1', { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to purge expired notes');
  }
}

// ============================================================
// Sources
// ============================================================

export async function getSources(_userId?: string): Promise<any[]> {
  const res = await fetch('/api/sources', { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load sources');
  }
  const data = await res.json();
  return data.sources ?? [];
}

export async function createSource(input: {
  user_id?: string;
  type: string;
  file_name: string;
  size_bytes: number;
  file_url?: string;
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

// ============================================================
// Upload (Presigned URL → R2) — PRD mục 3.1/4.1
// Client đẩy file thẳng lên Cloudflare R2, KHÔNG đi qua server
// (tránh giới hạn 4.5MB request payload của Vercel).
// ============================================================

export async function presignUpload(input: {
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string; uploadId: string; expiresIn: number }> {
  const res = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to get presigned URL');
  }
  const json = await res.json();
  return json.data ?? json;
}

/** Upload file trực tiếp lên presigned URL (R2), không qua Vercel server */
export async function putFileToR2(uploadUrl: string, file: File): Promise<boolean> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok && res.status !== 200) {
    throw new Error(`Upload to R2 failed with HTTP ${res.status}`);
  }
  return true;
}

export async function confirmUpload(key: string, uploadId: string): Promise<any> {
  const res = await fetch(`/api/upload/put?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}`, {
    method: 'PUT',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to confirm upload');
  }
  return res.json();
}

/** One-shot: presign → PUT R2 → confirm — dùng cho client upload file thật */
export async function uploadFileToR2(file: File): Promise<{ key: string; uploadId: string; publicUrl: string }> {
  const presign = await presignUpload({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
  });
  await putFileToR2(presign.uploadUrl, file);
  await confirmUpload(presign.key, presign.uploadId);
  return { key: presign.key, uploadId: presign.uploadId, publicUrl: presign.publicUrl };
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

export async function getUserProfile(_userId?: string): Promise<any | null> {
  const res = await fetch('/api/profile', { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load profile');
  }
  const data = await res.json();
  return data.profile ?? null;
}

export async function applyCouponToUser(code: string): Promise<any> {
  const res = await fetch('/api/coupons/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to apply coupon');
  }
  const data = await res.json();
  return data;
}

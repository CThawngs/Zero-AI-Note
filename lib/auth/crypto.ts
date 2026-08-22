import crypto from 'crypto';

/**
 * BYOK API-key encryption at rest (AES-256-GCM) + SSRF guard (PRD mục 3.3).
 *
 * Encrypt format: "v1.<iv_b64>.<tag_b64>.<ciphertext_b64>"
 * Key nguồn: BYOK_ENCRYPTION_KEY (ưu tiên) hoặc ZERO_JWT_SECRET (fallback dev).
 * ponytail: chưa có CRUD route cho byok_providers nên decrypt chưa được wire —
 * thêm khi implement POST/PUT /api/providers.
 */

function getKey(): Buffer {
  const secret = (process.env.BYOK_ENCRYPTION_KEY || process.env.ZERO_JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('Thiếu BYOK_ENCRYPTION_KEY/ZERO_JWT_SECRET — không thể mã hoá API key (fail-closed).');
  }
  // Derive 32-byte key ổn định từ secret (scrypt, salt cố định vì secret đã là high-entropy)
  return crypto.scryptSync(secret, 'zero-ai-note/byok-v1', 32);
}

export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

export function decryptApiKey(encoded: string): string {
  const parts = encoded.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Định dạng api_key_encrypted không hợp lệ.');
  }
  const iv = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');
  const ct = Buffer.from(parts[3], 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/**
 * SSRF guard: chỉ cho phép URL public http(s). Chặn localhost/private-link/metadata IP
 * (169.254.169.254...) trước khi server chủ động fetch endpoint do user cung cấp.
 */
export function assertPublicUrl(rawUrl: string): void {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new Error('Endpoint URL không hợp lệ.');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`Protocol ${u.protocol} không được hỗ trợ — chỉ dùng http(s).`);
  }

  const host = u.hostname.toLowerCase();
  // IPv6 loopback / ULA / link-local
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    throw new Error('Endpoint không được trỏ tới địa chỉ nội bộ (SSRF blocked).');
  }
  // Tên miền nội bộ
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error('Endpoint không được trỏ tới hostname nội bộ (SSRF blocked).');
  }
  // IPv4 private/reserved/metadata
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    const blocked =
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) ||           // link-local + cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
    if (blocked) {
      throw new Error('Endpoint không được trỏ tới dải IP riêng/reserved (SSRF blocked).');
    }
  }
}

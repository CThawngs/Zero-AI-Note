import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

let sqlInstance: ReturnType<typeof neon> | null = null;

/**
 * Sanitize & normalize a Postgres connection string:
 * - trim whitespace / surrounding quotes
 * - URL-encode the password portion if it contains characters that would
 *   break URL parsing (@ : / % # ? space ...) — Neon passwords can contain
 *   such chars; a raw copy-paste into .env / Vercel env then fails with
 *   "password authentication failed" even though the password is correct.
 *   We re-encode ONLY the password segment; everything else stays as-is.
 */
export function sanitizeDbUrl(raw: string): string {
  const url = raw.trim().replace(/^[\"']|[\"']$/g, '');
  try {
    const parsed = new URL(url);
    if (parsed.username && parsed.password) {
      // Decode first (in case it's already encoded), then re-encode strictly.
      const user = decodeURIComponent(parsed.username);
      const pass = decodeURIComponent(parsed.password);
      parsed.username = user;
      parsed.password = pass;
      const out = parsed.toString();
      // new URL().toString() normalizes; keep protocol+host+path exact.
      return out;
    }
    return url;
  } catch {
    // Not a parseable URL — return as-is (neon driver will surface the real error).
    return url;
  }
}

export function getSql() {
  if (!sqlInstance) {
    const rawUrl =
      process.env.NEON_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    if (!rawUrl) {
      throw new Error(
        'Missing database connection string. Set NEON_DATABASE_URL or DATABASE_URL in .env.local (dev) or Vercel Environment Variables (prod).'
      );
    }

    const url = sanitizeDbUrl(rawUrl);

    // Diagnose WITHOUT leaking secrets: log only host/user/db + whether the
    // URL had to be re-encoded. Never log the password.
    try {
      const u = new URL(url);
      console.log(
        `[db] connecting → host=${u.hostname} user=${u.username ? decodeURIComponent(u.username) : '(none)'} db=${u.pathname.split('/').filter(Boolean)[0] ?? '(default)'} passLen=${u.password.length} reencoded=${url !== rawUrl.trim().replace(/^[\"']|[\"']$/g, '')}`
      );
    } catch {
      console.log(`[db] connecting → (unparseable url, host unknown)`);
    }

    sqlInstance = neon(url);
  }
  return sqlInstance;
}

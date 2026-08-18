import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

let sqlInstance: ReturnType<typeof neon> | null = null;

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
    const url = rawUrl.trim().replace(/^["']|["']$/g, '');
    sqlInstance = neon(url);
  }
  return sqlInstance;
}
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
      throw new Error(
        'Missing NEON_DATABASE_URL. Add it to .env.local (dev) or Vercel env (prod).'
      );
    }
    sqlInstance = neon(url);
  }
  return sqlInstance;
}
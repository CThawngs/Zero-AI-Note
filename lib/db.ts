/**
 * Neon serverless database for Zero AI Note — rewrite to the simplest buildable form
 * to unblock Next.js build. Connection is created lazily from NEON_DATABASE_URL.
 */
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

function getConnectionString(): string {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing NEON_DATABASE_URL. Add it to .env.local (dev) or Vercel env (prod).'
    );
  }
  return url;
}

const getSql = () => neon(getConnectionString());

export const sql = getSql();

export default sql;
import { neon, neonConfig, Pool } from '@neondatabase/serverless';

// Edge runtime config for Vercel serverless
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

// For Vercel edge / Node serverless
export const sql = neon(getConnectionString());

// For long-running Node processes (migrations, scripts)
export const pool = new Pool({ connectionString: getConnectionString() });

export default { sql, pool };

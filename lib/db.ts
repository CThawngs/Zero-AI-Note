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

let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    sqlInstance = neon(getConnectionString());
  }
  return sqlInstance;
}

// Lazy callable: `sql`query...` works, and getSql() returns the neon instance.
type NeonFn = ReturnType<typeof neon>;
const sql = ((...args: Parameters<NeonFn>) => {
  const instance = getSql();
  return (instance as (...a: Parameters<NeonFn>) => ReturnType<NeonFn>)(...args);
}) as NeonFn & { getSql: typeof getSql };

(sql as unknown as { getSql: typeof getSql }).getSql = getSql;

export default sql;
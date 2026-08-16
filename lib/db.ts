import { neon, neonConfig, Pool } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

const connectionString: string | undefined = process.env.NEON_DATABASE_URL ?? undefined;

function getConnectionString(): string {
  if (!connectionString) {
    throw new Error(
      'Missing NEON_DATABASE_URL. Add it to .env.local (dev) or Vercel env (prod).'
    );
  }
  return connectionString;
}

let sqlInstance: ReturnType<typeof neon> | null = null;
let poolInstance: Pool | null = null;

export function getSql() {
  if (!sqlInstance) {
    sqlInstance = neon(getConnectionString());
  }
  return sqlInstance;
}

export function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: getConnectionString() });
  }
  return poolInstance;
}

export const sql = getSql();

export default sql;
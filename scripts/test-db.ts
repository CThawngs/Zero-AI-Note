import { neon } from '@neondatabase/serverless';

// Load env from .env.local if present
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error('Missing NEON_DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log('Testing connection...');
  const res = await sql`select version()`;
  console.log('Connected:', res[0]?.version?.slice(0, 60));

  console.log('\nChecking tables:');
  const tables = await sql`
    select table_name from information_schema.tables 
    where table_schema = 'public' order by table_name
  `;
  tables.forEach(t => console.log('  -', t.table_name));

  if (tables.length === 0) {
    console.log('\nNo tables yet. Run: NEON_DATABASE_URL=... bun run scripts/migrate.ts');
  }
}

main().catch(err => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
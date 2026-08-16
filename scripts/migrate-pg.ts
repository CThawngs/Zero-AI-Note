/**
 * Migrate Neon via pg (TCP) — most reliable for DDL/DDL+commit.
 * Usage: NEON_DATABASE_URL=... node --experimental-strip-types scripts/migrate-pg.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'docs', 'schema-neon.sql');

async function main() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    console.error('Missing NEON_DATABASE_URL');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log('Connected via pg (TCP)');

  const raw = readFileSync(schemaPath, 'utf-8');
  // strip comment lines, then split on ; at end of line (respect quoted strings not needed for our schema)
  const schema = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');

  const statements = schema
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let ok = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        console.log(`  ~ ${stmt.slice(0, 60)} (exists, skip)`);
      } else {
        console.error(`  ✗ ${stmt.slice(0, 80)}`);
        console.error(`    ${msg}`);
      }
    }
  }

  console.log(`Done: ${ok} statements applied.`);

  const tables = await client.query(
    `select table_name from information_schema.tables where table_schema='public' order by table_name`
  );
  console.log('Tables:', tables.rows.map((r) => r.table_name).join(', '));

  await client.end();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
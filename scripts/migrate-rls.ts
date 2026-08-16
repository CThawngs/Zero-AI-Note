/**
 * Migrate RLS policies after tables exist.
 * `auth_uid()` function must exist before policies reference it.
 * Usage: NEON_DATABASE_URL=... bun run scripts/migrate-rls.ts
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

  // 1. Create auth_uid() function FIRST (as a single statement)
  const fnSql = `
    create or replace function auth_uid() returns uuid as $$
      select nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'
    $$ language sql stable;
  `;
  try {
    await client.query(fnSql);
    console.log('✓ auth_uid() function created');
  } catch (err) {
    console.error('✗ auth_uid() failed:', err.message);
  }

  // 2. Create policies (extract only create policy / alter table enable rls statements)
  const raw = readFileSync(schemaPath, 'utf-8');
  const lines = raw.split('\n').filter((l) => !l.trim().startsWith('--'));
  const statements: string[] = [];
  let current = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('create policy') || trimmed.startsWith('alter table')) {
      if (current) { /* flush */ }
      current = line;
    } else if (trimmed === '') {
      if (current) { statements.push(current); current = ''; }
    } else {
      current += '\n' + line;
    }
  }
  if (current) statements.push(current);

  let ok = 0, skipped = 0, failed = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        skipped++;
      } else {
        failed++;
        console.error(`✗ ${stmt.slice(0, 70)}`);
        console.error(`  ${msg}`);
      }
    }
  }
  console.log(`Done: ${ok} ok, ${skipped} skipped, ${failed} failed.`);

  // 3. Verify
  const pol = await client.query(`select policyname, tablename from pg_policies order by tablename`);
  console.log('\nPolicies:');
  pol.rows.forEach((r) => console.log('  -', r.tablename, '/', r.policyname));

  await client.end();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
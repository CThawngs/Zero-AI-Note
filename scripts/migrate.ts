/**
 * Migrate script — run schema-neon.sql against Neon.
 * Usage: NEON_DATABASE_URL=... bun run scripts/migrate.ts
 *
 * Fix: strip SQL comments before splitting so `create table` statements
 * (which follow a comment line) are NOT filtered out.
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'docs', 'schema-neon.sql');

function stripComments(sql: string): string {
  return sql
    .split('\n')
    .map((line) => (line.trim().startsWith('--') ? '' : line))
    .join('\n');
}

async function main() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    console.error('Missing NEON_DATABASE_URL');
    process.exit(1);
  }

  const sql = neon(url);
  const raw = readFileSync(schemaPath, 'utf-8');
  const schema = stripComments(raw);

  console.log('Running migrations (comment-stripped)...');
  try {
    // Split on ";\n" after comments removed; drop empty statements.
    const statements = schema
      .split(';\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    let ok = 0;
    let skipped = 0;
    let failed = 0;

    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt);
        ok++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const lower = msg.toLowerCase();
        const isDup = lower.includes('already exists') || lower.includes('duplicate');

        if (isDup) {
          skipped++;
        } else {
          failed++;
          console.error(`  ✗ FAILED: ${stmt.slice(0, 90)}`);
          console.error(`    ${msg}`);
        }
      }
    }

    console.log(`\nDone: ${ok} ok, ${skipped} skipped (duplicate), ${failed} failed.`);

    // Verify tables exist now
    const tables = await sql`select table_name from information_schema.tables where table_schema='public' order by table_name`;
    console.log('Tables in DB:', tables.map((t: { table_name: string }) => t.table_name).join(', ') || '(none)');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
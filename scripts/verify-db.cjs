// Verify Neon DB state after full CRUD tests
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const url = process.env.NEON_DATABASE_URL;
const sql = neon(url);

async function main() {
  console.log('=== TABLES ===');
  const tables = await sql`select table_name from information_schema.tables where table_schema='public' order by table_name`;
  tables.forEach(t => console.log('  -', t.table_name));

  console.log('\n=== PROFILES ===');
  const profiles = await sql`select id, email, role, plan from profiles order by created_at desc`;
  profiles.forEach(p => console.log(`  ${p.email} | role=${p.role} | plan=${p.plan}`));

  console.log('\n=== COUPONS ===');
  const coupons = await sql`select code, discount_type, discount_value, usage_count, status from coupons`;
  coupons.forEach(c => console.log(`  ${c.code} | ${c.discount_type} ${c.discount_value} | used=${c.usage_count} | ${c.status}`));

  console.log('\n=== NOTES / SOURCES ===');
  const notes = await sql`select count(*)::int as n from notes`;
  const sources = await sql`select count(*)::int as n from sources`;
  console.log(`  notes=${notes[0].n} sources=${sources[0].n}`);

  console.log('\n=== RLS Enabled tables ===');
  const rls = await sql`select tablename from pg_tables where schemaname='public' and rowsecurity=true order by tablename`;
  rls.forEach(t => console.log('  -', t.tablename));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
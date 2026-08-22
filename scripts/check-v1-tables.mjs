import { readFileSync } from 'fs';
let dburl;
for (const line of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  if (line.startsWith('NEON_DATABASE_URL=')) dburl = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
}
if (!dburl) { console.log('NO_DB_URL'); process.exit(1); }
const { neon } = await import('@neondatabase/serverless');
const sql = neon(dburl);
try {
  const t = async (name) => (await sql`select to_regclass(${name}) as t`)[0].t;
  console.log('knowledge_objects:', await t('knowledge_objects'));
  console.log('coverage_ledger:', await t('coverage_ledger'));
  console.log('content_chunks:', await t('content_chunks'));
} catch (e) {
  console.log('ERR', e.message);
}

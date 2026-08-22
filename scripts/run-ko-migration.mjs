import { readFileSync } from 'fs';
let dburl;
for (const line of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  if (line.startsWith('NEON_DATABASE_URL=')) dburl = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
}
if (!dburl) { console.log('NO_DB_URL'); process.exit(1); }
const { neon } = await import('@neondatabase/serverless');
const sql = neon(dburl);

// Từng statement 1 (neon-http không chạy multi-statement string)
const stmts = [
  sql`create table if not exists knowledge_objects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    source_id uuid references sources(id) on delete cascade,
    notebook_id uuid references notebooks(id) on delete cascade,
    summary text,
    facts text[],
    topics text[],
    entities jsonb,
    numbers text[],
    dates text[],
    decisions text[],
    action_items text[],
    questions text[],
    quotes text[],
    model_version text,
    prompt_version text,
    schema_version text default 'v1',
    created_at timestamptz default now()
  )`,
  sql`create index if not exists idx_ko_source on knowledge_objects(source_id)`,
  sql`create index if not exists idx_ko_notebook on knowledge_objects(notebook_id)`,
  sql`create table if not exists coverage_ledger (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    source_id uuid references sources(id) on delete cascade,
    notebook_id uuid references notebooks(id) on delete cascade,
    extracted boolean default false,
    knowledge_extracted boolean default false,
    section_included boolean default false,
    note_included boolean default false,
    updated_at timestamptz default now()
  )`,
  sql`create index if not exists idx_cl_source on coverage_ledger(source_id)`,
  sql`create index if not exists idx_cl_notebook on coverage_ledger(notebook_id)`,
];

try {
  for (const [i, st] of stmts.entries()) {
    await st;
    console.log('stmt', i + 1, 'OK');
  }
  const t = async (name) => (await sql`select to_regclass(${name}) as t`)[0].t;
  console.log('knowledge_objects:', await t('knowledge_objects'));
  console.log('coverage_ledger:', await t('coverage_ledger'));
} catch (e) {
  console.log('ERR', e.message);
  process.exit(1);
}

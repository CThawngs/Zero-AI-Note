-- Migration: knowledge_objects + coverage_ledger (PRD 4.0.7/4.0.9)
-- Chạy an toàn lặp lại (idempotent: create if not exists + add column if not exists).
-- LƯU Ý: legacy schema dùng sources(id)/notebooks(id) — các bảng v1 tham chiếu
-- profiles để không phụ thuộc projects/files chưa migrate. user_id là bắt buộc
-- cho RLS sau này.

create table if not exists knowledge_objects (
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
);
create index if not exists idx_ko_source on knowledge_objects(source_id);
create index if not exists idx_ko_notebook on knowledge_objects(notebook_id);

create table if not exists coverage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  notebook_id uuid references notebooks(id) on delete cascade,
  extracted boolean default false,
  knowledge_extracted boolean default false,
  section_included boolean default false,
  note_included boolean default false,
  updated_at timestamptz default now()
);
create index if not exists idx_cl_source on coverage_ledger(source_id);
create index if not exists idx_cl_notebook on coverage_ledger(notebook_id);

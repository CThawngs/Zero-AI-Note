-- Zero AI Note — Neon Postgres schema (adapted for Neon + JWT auth, no Supabase)
-- Run this in Neon SQL Editor or via scripts/migrate.ts

-- 1. profiles (JWT auth: email + password_hash)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  display_name text,
  role text default 'user' check (role in ('user','admin')),
  plan text default 'free' check (plan in ('free','pro','ultra')),
  plan_renews_at timestamptz,
  processing_minutes_used int default 0,
  processing_minutes_limit int default 120,
  created_at timestamptz default now()
);

-- 2. notebooks
create table if not exists notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  tags text[],
  is_merged boolean default false,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- 3. sources (file/link nguồn gốc)
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text check (type in ('video','audio','pdf','image','slide','text','url','youtube')),
  file_url text,
  original_url text,
  size_bytes bigint,
  duration_seconds int,
  status text default 'pending' check (status in ('pending','processing','processed','error')),
  transcript text,
  retention_delete_at timestamptz,
  created_at timestamptz default now()
);

-- 4. custom_note_templates
create table if not exists custom_note_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description_prompt text not null,
  created_at timestamptz default now()
);

-- 5. notes (content_structured là nguồn duy nhất)
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  method text,
  custom_template_id uuid references custom_note_templates(id) on delete set null,
  output_language text default 'vi',
  content_structured jsonb,
  confidence_flags jsonb,
  created_at timestamptz default now()
);

-- 6. byok_providers
create table if not exists byok_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text,
  provider_id text,
  endpoint_url text,
  default_model text,
  api_key_encrypted text,
  is_default boolean default false,
  last_test_status text,
  import_free_models boolean default false,
  sync_enabled boolean default false,
  created_at timestamptz default now()
);

-- 7. provider_free_models_cache (dùng chung, không polling riêng từng user)
create table if not exists provider_free_models_cache (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  model_id text not null,
  is_free boolean default true,
  last_checked_at timestamptz default now(),
  unique (provider_id, model_id)
);

-- 8. coupons
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value numeric,
  applies_to text default 'all' check (applies_to in ('all','paid')),
  usage_limit int,
  usage_count int default 0,
  expires_at timestamptz,
  status text default 'active' check (status in ('active','expired','disabled')),
  created_at timestamptz default now()
);

-- 9. subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  bill_id text unique not null,
  plan text not null check (plan in ('pro','ultra')),
  amount numeric,
  status text default 'pending' check (status in ('pending','paid','expired','canceled')),
  qr_data text,
  coupon_code text,
  payment_account_id text,   -- Zero Tracking payee chosen at checkout (null = app default); snapshot for traceability
  paid_at timestamptz,
  renews_at timestamptz,
  created_at timestamptz default now()
);

-- Migrate cho DB cũ (bảng subscriptions từng dùng zeroinvoice_invoice_id)
-- Bước 1: thêm cột mới nếu chưa có (idempotent)
alter table subscriptions add column if not exists bill_id text;
alter table subscriptions add column if not exists plan text;
alter table subscriptions add column if not exists qr_data text;
alter table subscriptions add column if not exists paid_at timestamptz;
-- Bước 2: copy dữ liệu cũ (nếu có) từ zeroinvoice_invoice_id sang bill_id
update subscriptions set bill_id = zeroinvoice_invoice_id where bill_id is null and zeroinvoice_invoice_id is not null;
update subscriptions set status = 'paid' where status = 'active';
update subscriptions set status = 'canceled' where status = 'past_due';
-- Bước 3: xoá cột cũ (sau khi đã copy) — an toàn vì không còn code tham chiếu
delete from subscriptions where bill_id is null;
alter table subscriptions drop column if exists zeroinvoice_invoice_id;
-- Bước 4: ràng buộc chuẩn hoá
alter table subscriptions alter column bill_id set not null;
alter table subscriptions add constraint subscriptions_bill_id_unique unique (bill_id);
alter table subscriptions add constraint subscriptions_plan_check check (plan in ('pro','ultra'));
alter table subscriptions add constraint subscriptions_status_check check (status in ('pending','paid','expired','canceled'));

-- 10. jobs (background pipeline)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  source_key text,
  note_id uuid,
  method text default 'cornell',
  language text default 'vi',
  model text,
  status text default 'queued' check (status in ('queued','processing','done','error')),
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migrate cho DB cũ (create table if not exists không sửa bảng đã tồn tại)
alter table jobs add column if not exists note_id uuid;

-- 11. uploads (file upload tracking)
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  file_key text not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint,
  status text default 'pending' check (status in ('pending','completed','error','deleted')),
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

-- RLS for uploads
alter table uploads enable row level security;
create policy "user reads own uploads" on uploads for select using (auth_uid() = user_id);
create policy "user writes own uploads" on uploads for insert with check (auth_uid() = user_id);
create policy "user updates own uploads" on uploads for update using (auth_uid() = user_id);

-- ============================================================
-- RLS — mọi bảng chứa dữ liệu cá nhân đều bật RLS
-- Dùng pattern current_setting('request.jwt.claims') cho Neon (custom JWT)
-- Backend owner bypasses RLS (trusted), policies là defense-in-depth cho restricted role
-- ============================================================

create or replace function auth_uid() returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'
$$ language sql stable;

alter table profiles enable row level security;
create policy "user reads own profile" on profiles for select using (auth_uid() = id);
create policy "user updates own profile" on profiles for update using (auth_uid() = id);
create policy "admin manages all profiles" on profiles for all using (
  exists (select 1 from profiles where id = auth_uid() and role = 'admin')
);

alter table notebooks enable row level security;
create policy "user reads own notebooks" on notebooks for select using (auth_uid() = user_id);
create policy "user writes own notebooks" on notebooks for insert with check (auth_uid() = user_id);
create policy "user updates own notebooks" on notebooks for update using (auth_uid() = user_id);

alter table sources enable row level security;
create policy "user reads own sources" on sources for select using (auth_uid() = user_id);
create policy "user writes own sources" on sources for insert with check (auth_uid() = user_id);
create policy "user updates own sources" on sources for update using (auth_uid() = user_id);

alter table notes enable row level security;
create policy "user reads own notes" on notes for select using (auth_uid() = user_id);
create policy "user writes own notes" on notes for insert with check (auth_uid() = user_id);
create policy "user updates own notes" on notes for update using (auth_uid() = user_id);

alter table custom_note_templates enable row level security;
create policy "user reads own templates" on custom_note_templates for select using (auth_uid() = user_id);
create policy "user writes own templates" on custom_note_templates for insert with check (auth_uid() = user_id);

alter table byok_providers enable row level security;
create policy "user reads own providers" on byok_providers for select using (auth_uid() = user_id);
create policy "user writes own providers" on byok_providers for insert with check (auth_uid() = user_id);
create policy "user updates own providers" on byok_providers for update using (auth_uid() = user_id);
create policy "user deletes own providers" on byok_providers for delete using (auth_uid() = user_id);

alter table coupons enable row level security;
create policy "admin manages coupons" on coupons for all using (
  exists (select 1 from profiles where id = auth_uid() and role = 'admin')
);
create policy "anyone reads active coupons" on coupons for select using (status = 'active');

alter table subscriptions enable row level security;
create policy "user reads own subscription" on subscriptions for select using (auth_uid() = user_id);
create policy "user writes own subscription" on subscriptions for insert with check (auth_uid() = user_id);

alter table jobs enable row level security;
create policy "user reads own jobs" on jobs for select using (auth_uid() = user_id);
create policy "user writes own jobs" on jobs for insert with check (auth_uid() = user_id);

-- Indexes
create index if not exists idx_notebooks_user_id on notebooks(user_id);
create index if not exists idx_sources_user_id on sources(user_id);
create index if not exists idx_sources_notebook_id on sources(notebook_id);
create index if not exists idx_notes_user_id on notes(user_id);
create index if not exists idx_notes_notebook_id on notes(notebook_id);
create index if not exists idx_byok_providers_user_id on byok_providers(user_id);
create index if not exists idx_coupons_status on coupons(status);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_jobs_status on jobs(status);

-- ============================================================
-- Architecture v1 additions (2026-08-22 lock)
-- Reference: docs/ARCHITECTURE_V1.md, docs/MIGRATION_PLAN.md
-- Idempotent: CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================

-- 12. projects — Multi-file processing unit (Architecture v1 §9)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  status text default 'queued' check (status in ('queued','running','completed','failed','partial')),
  job_graph_ref jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_status on projects(status);

alter table projects enable row level security;
create policy "user reads own projects" on projects for select using (auth_uid() = user_id);
create policy "user writes own projects" on projects for insert with check (auth_uid() = user_id);
create policy "user updates own projects" on projects for update using (auth_uid() = user_id);

-- 13. files — Per-file processing state
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  duration_seconds int,
  status text default 'pending' check (status in ('pending','processing','completed','failed')),
  r2_key text,
  processing_progress int default 0,
  media_processor_used text,
  created_at timestamptz default now()
);
create index if not exists idx_files_project_id on files(project_id);
create index if not exists idx_files_user_id on files(user_id);

alter table files enable row level security;
create policy "user reads own files" on files for select using (auth_uid() = user_id);
create policy "user writes own files" on files for insert with check (auth_uid() = user_id);
create policy "user updates own files" on files for update using (auth_uid() = user_id);

-- 14. jobs enhancement — idempotency_key, attempt, priority (Architecture v1 §11)
-- Existing `jobs` table is preserved. Add columns idempotently.
alter table jobs add column if not exists project_id uuid references projects(id) on delete cascade;
alter table jobs add column if not exists file_id uuid references files(id) on delete cascade;
alter table jobs add column if not exists chunk_id uuid;
alter table jobs add column if not exists job_type text;
alter table jobs add column if not exists attempt int default 0;
alter table jobs add column if not exists priority int default 5;
alter table jobs add column if not exists idempotency_key text;
alter table jobs add column if not exists started_at timestamptz;
alter table jobs add column if not exists completed_at timestamptz;
alter table jobs rename column source_key to r2_key;
alter table jobs rename column id to job_id;
alter table jobs rename column error to error_message;

-- Ensure legacy columns nullable (if existed in old schema)
alter table jobs alter column r2_key drop not null;
alter table jobs alter column note_id drop not null;
alter table jobs alter column method drop not null;
alter table jobs alter column language drop not null;
alter table jobs alter column model drop not null;

-- Idempotency unique constraint (when key present)
create unique index if not exists idx_jobs_idempotency_key_unique
  on jobs(idempotency_key) where idempotency_key is not null;

create index if not exists idx_jobs_project_id on jobs(project_id);
create index if not exists idx_jobs_file_id on jobs(file_id);
create index if not exists idx_jobs_job_type on jobs(job_type);

-- 15. content_chunks — Normalized content + token_count + location metadata
create table if not exists content_chunks (
  chunk_id uuid primary key default gen_random_uuid(),
  file_id uuid references files(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  source_type text check (source_type in ('video','audio','docx','pptx')),
  text text not null,
  token_count int,
  location jsonb,
  heading text,
  chunk_index int,
  created_at timestamptz default now()
);
create index if not exists idx_content_chunks_file_id on content_chunks(file_id);
create index if not exists idx_content_chunks_project_id on content_chunks(project_id);

alter table content_chunks enable row level security;
create policy "user reads own chunks" on content_chunks for select using (auth_uid() = user_id);
create policy "user writes own chunks" on content_chunks for insert with check (auth_uid() = user_id);

-- 16. knowledge_objects — Structured extraction (Architecture v1 §14)
create table if not exists knowledge_objects (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid references content_chunks(chunk_id) on delete cascade,
  file_id uuid references files(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
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
  schema_version text,
  created_at timestamptz default now()
);
create index if not exists idx_knowledge_objects_project_id on knowledge_objects(project_id);
create index if not exists idx_knowledge_objects_chunk_id on knowledge_objects(chunk_id);

alter table knowledge_objects enable row level security;
create policy "user reads own knowledge_objects" on knowledge_objects for select using (auth_uid() = user_id);
create policy "user writes own knowledge_objects" on knowledge_objects for insert with check (auth_uid() = user_id);

-- 17. embeddings — pgvector (Architecture v1 §15)
create extension if not exists vector;
create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid references content_chunks(chunk_id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  vector vector(1536),
  model text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_embeddings_vector_ivfflat
  on embeddings using ivfflat (vector vector_cosine_ops);
create index if not exists idx_embeddings_project_id on embeddings(project_id);
create index if not exists idx_embeddings_user_id on embeddings(user_id);

alter table embeddings enable row level security;
create policy "user reads own embeddings" on embeddings for select using (auth_uid() = user_id);
create policy "user writes own embeddings" on embeddings for insert with check (auth_uid() = user_id);

-- 18. summaries — Section/File/Cross-file/Project
create table if not exists summaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  file_id uuid references files(id) on delete cascade,
  scope text check (scope in ('section','file','cross_file','project')),
  scope_ref_id uuid,
  summary text not null,
  key_facts text[],
  entities jsonb,
  important_numbers text[],
  decisions text[],
  questions text[],
  model_version text,
  prompt_version text,
  created_at timestamptz default now()
);
create index if not exists idx_summaries_project_id on summaries(project_id);
create index if not exists idx_summaries_scope on summaries(scope);

alter table summaries enable row level security;
create policy "user reads own summaries" on summaries for select using (auth_uid() = user_id);
create policy "user writes own summaries" on summaries for insert with check (auth_uid() = user_id);

-- 19. evidence — Mọi claim → source location (Architecture v1 §16)
create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  note_id uuid,
  claim text not null,
  source_id uuid references files(id) on delete cascade,
  location jsonb,
  verbatim_text text,
  confidence real,
  created_at timestamptz default now()
);
create index if not exists idx_evidence_note_id on evidence(note_id);
create index if not exists idx_evidence_source_id on evidence(source_id);

alter table evidence enable row level security;
create policy "user reads own evidence" on evidence for select using (
  exists (select 1 from files f where f.id = evidence.source_id and f.user_id = auth_uid())
);
create policy "user writes own evidence" on evidence for insert with check (
  exists (select 1 from files f where f.id = evidence.source_id and f.user_id = auth_uid())
);

-- 20. entities — Normalized entities (Architecture v1 §18)
create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  canonical_name text not null,
  entity_type text,
  aliases text[],
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_entities_project_id on entities(project_id);

alter table entities enable row level security;
create policy "user reads own entities" on entities for select using (auth_uid() = user_id);
create policy "user writes own entities" on entities for insert with check (auth_uid() = user_id);

-- 21. relationships — Entity co-occurrence
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  entity_a_id uuid references entities(id) on delete cascade,
  entity_b_id uuid references entities(id) on delete cascade,
  relationship_type text,
  weight real default 1.0,
  evidence_ids uuid[],
  created_at timestamptz default now()
);

alter table relationships enable row level security;
create policy "user reads own relationships" on relationships for select using (auth_uid() = user_id);
create policy "user writes own relationships" on relationships for insert with check (auth_uid() = user_id);

-- 22. conflicts — Cross-file disagreement (Architecture v1 §17)
create table if not exists conflicts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  topic text not null,
  sources jsonb,
  resolution text default 'unresolved' check (resolution in ('unresolved','user_decided','most_authoritative')),
  resolution_note text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

alter table conflicts enable row level security;
create policy "user reads own conflicts" on conflicts for select using (auth_uid() = user_id);
create policy "user writes own conflicts" on conflicts for insert with check (auth_uid() = user_id);

-- 23. usage — Metered AI calls (Architecture v1 §20)
create table if not exists usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  file_id uuid references files(id) on delete set null,
  job_id uuid references jobs(job_id) on delete set null,
  provider text not null,
  model text not null,
  operation text not null,
  input_tokens int default 0,
  output_tokens int default 0,
  neurons int,
  audio_seconds real,
  cost_usd real,
  timestamp timestamptz default now()
);
create index if not exists idx_usage_user_id_timestamp on usage(user_id, timestamp);
create index if not exists idx_usage_project_id on usage(project_id);

alter table usage enable row level security;
create policy "user reads own usage" on usage for select using (auth_uid() = user_id);
create policy "user writes own usage" on usage for insert with check (auth_uid() = user_id);

-- 24. quotas — Daily/per-user quota state + reservation tracking (Architecture v1 §21)
create table if not exists quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  resource_type text not null,
  period_start date not null,
  period_end date not null,
  limit_value bigint not null,
  consumed bigint default 0,
  reserved bigint default 0,
  updated_at timestamptz default now(),
  unique (user_id, resource_type, period_start)
);
create index if not exists idx_quotas_user_id on quotas(user_id);

alter table quotas enable row level security;
create policy "user reads own quotas" on quotas for select using (auth_uid() = user_id);
create policy "user writes own quotas" on quotas for insert with check (auth_uid() = user_id);
create policy "user updates own quotas" on quotas for update using (auth_uid() = user_id);

-- 25. coverage_ledger — Pipeline coverage per chunk (Architecture v1 §22)
create table if not exists coverage_ledger (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid references content_chunks(chunk_id) on delete cascade,
  file_id uuid references files(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  transcribed boolean default false,
  parsed boolean default false,
  normalized boolean default false,
  knowledge_extracted boolean default false,
  embedded boolean default false,
  section_included boolean default false,
  file_included boolean default false,
  project_included boolean default false,
  project_ready boolean default false,
  updated_at timestamptz default now()
);
create index if not exists idx_coverage_ledger_project_id on coverage_ledger(project_id);
create index if not exists idx_coverage_ledger_chunk_id on coverage_ledger(chunk_id);

alter table coverage_ledger enable row level security;
create policy "user reads own coverage_ledger" on coverage_ledger for select using (auth_uid() = user_id);
create policy "user writes own coverage_ledger" on coverage_ledger for insert with check (auth_uid() = user_id);
create policy "user updates own coverage_ledger" on coverage_ledger for update using (auth_uid() = user_id);

-- ============================================================
-- Cleanup deprecated (Architecture v1 lock)
-- ============================================================

-- Drop unused Auto-Sync columns from byok_providers
alter table byok_providers drop column if exists import_free_models;
alter table byok_providers drop column if exists sync_enabled;

-- Drop provider_free_models_cache table (Auto-Sync removed)
drop table if exists provider_free_models_cache;

-- ============================================================
-- Architecture v1 lock marker
-- ============================================================
comment on schema public is 'Zero AI Note schema — Architecture v1 locked 2026-08-22. See docs/ARCHITECTURE_V1.md.';
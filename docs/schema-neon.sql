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
-- Zero AI Note — Neon Postgres schema (PRD mục 6 + RLS)
-- Run này一次 tạo đủ 9 bảng + index + RLS policies.

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- 1. profiles (mở rộng từ auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text default 'user' check (role in ('user','admin')),
  plan text default 'free' check (plan in ('free','pro','ultra')),
  plan_renews_at timestamptz,
  processing_minutes_used int default 0,
  processing_minutes_limit int default 120,
  created_at timestamptz default now()
);

-- 2. notebooks
create table notebooks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  tags text[],
  is_merged boolean default false,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- 3. sources (file/link nguồn gốc)
create table sources (
  id uuid primary key default uuid_generate_v4(),
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
create table custom_note_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description_prompt text not null,
  created_at timestamptz default now()
);

-- 5. notes (content_structured là nguồn duy nhất)
create table notes (
  id uuid primary key default uuid_generate_v4(),
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
create table byok_providers (
  id uuid primary key default uuid_generate_v4(),
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
create table provider_free_models_cache (
  id uuid primary key default uuid_generate_v4(),
  provider_id text not null,
  model_id text not null,
  is_free boolean default true,
  last_checked_at timestamptz default now(),
  unique (provider_id, model_id)
);

-- 8. coupons
create table coupons (
  id uuid primary key default uuid_generate_v4(),
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
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  zeroinvoice_invoice_id text,
  status text check (status in ('active','canceled','past_due')),
  amount numeric,
  coupon_code text,
  renews_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS — mọi bảng chứa dữ liệu cá nhân đều bật RLS
-- ============================================================

alter table profiles enable row level security;
create policy "user reads own profile" on profiles for select using (auth.uid() = id);
create policy "user updates own profile" on profiles for update using (auth.uid() = id);
create policy "admin manages all profiles" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table notebooks enable row level security;
create policy "user reads own notebooks" on notebooks for select using (auth.uid() = user_id);
create policy "user writes own notebooks" on notebooks for insert with check (auth.uid() = user_id);
create policy "user updates own notebooks" on notebooks for update using (auth.uid() = user_id);

alter table sources enable row level security;
create policy "user reads own sources" on sources for select using (auth.uid() = user_id);
create policy "user writes own sources" on sources for insert with check (auth.uid() = user_id);
create policy "user updates own sources" on sources for update using (auth.uid() = user_id);

alter table notes enable row level security;
create policy "user reads own notes" on notes for select using (auth.uid() = user_id);
create policy "user writes own notes" on notes for insert with check (auth.uid() = user_id);
create policy "user updates own notes" on notes for update using (auth.uid() = user_id);

alter table custom_note_templates enable row level security;
create policy "user reads own templates" on custom_note_templates for select using (auth.uid() = user_id);
create policy "user writes own templates" on custom_note_templates for insert with check (auth.uid() = user_id);

alter table byok_providers enable row level security;
create policy "user reads own providers" on byok_providers for select using (auth.uid() = user_id);
create policy "user writes own providers" on byok_providers for insert with check (auth.uid() = user_id);
create policy "user updates own providers" on byok_providers for update using (auth.uid() = user_id);
create policy "user deletes own providers" on byok_providers for delete using (auth.uid() = user_id);

alter table coupons enable row level security;
create policy "admin manages coupons" on coupons for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "anyone reads active coupons" on coupons for select using (status = 'active');

alter table subscriptions enable row level security;
create policy "user reads own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "user writes own subscription" on subscriptions for insert with check (auth.uid() = user_id);

-- Indexes
create index idx_notebooks_user_id on notebooks(user_id);
create index idx_sources_user_id on sources(user_id);
create index idx_sources_notebook_id on sources(notebook_id);
create index idx_notes_user_id on notes(user_id);
create index idx_notes_notebook_id on notes(notebook_id);
create index idx_byok_providers_user_id on byok_providers(user_id);
create index idx_coupons_status on coupons(status);
create index idx_subscriptions_user_id on subscriptions(user_id);
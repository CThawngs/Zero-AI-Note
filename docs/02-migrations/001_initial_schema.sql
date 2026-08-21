-- ================================================================
-- Zero AI Note - Migration chuẩn hóa Neon DB
-- Ngày: 2026-08-21
-- Mục đích: Cập nhật profiles, subscriptions, thêm source_embeddings (pgvector)
-- ================================================================

-- Bật extension vector cho cosine similarity
create extension if not exists vector;

-- ================================================================
-- 1. PROFILES - Đã chuẩn hóa
-- ================================================================
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  google_id text unique,
  display_name text,
  role text default 'user' check (role in ('user','admin')),
  plan text default 'free' check (plan in ('free','pro','ultra')),
  processing_minutes_used integer default 0,
  plan_renews_at timestamptz,
  created_at timestamptz default now()
);

-- Backfill nếu bảng cũ đã tồn tại
alter table profiles add column if not exists password_hash text;
alter table profiles add column if not exists google_id text;
alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists plan text default 'free';
alter table profiles add column if not exists plan_renews_at timestamptz;
alter table profiles add column if not exists processing_minutes_used integer default 0;

-- ================================================================
-- 2. SUBSCRIPTIONS - Chuẩn Zero Tracking VietQR duy nhất
-- ================================================================
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  bill_id text unique not null,
  plan text not null check (plan in ('pro','ultra')),
  amount numeric not null,
  status text default 'pending' check (status in ('pending','paid','expired','canceled')),
  qr_data text,
  coupon_code text,
  paid_at timestamptz,
  renews_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_subscriptions_bill on subscriptions(bill_id);

-- ================================================================
-- 3. BYOK PROVIDERS - Multi-model identity injection
-- ================================================================
create table if not exists byok_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  provider_id text not null,
  endpoint_url text not null,
  default_model text not null,
  api_key_encrypted text,
  is_default boolean default false,
  last_test_status text,
  created_at timestamptz default now()
);

create index if not exists idx_byok_user on byok_providers(user_id);

-- ================================================================
-- 4. SOURCES - File tài liệu đầu vào
-- ================================================================
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  notebook_id uuid,
  type text check (type in ('pdf','youtube','audio','doc','image','video','text')),
  file_name text,
  file_url text,
  content_text text,
  size_bytes bigint default 0,
  duration_seconds integer,
  status text default 'pending' check (status in ('pending','transcribing','ready','failed')),
  r2_key text,
  created_at timestamptz default now()
);

-- ================================================================
-- 5. NOTES - Ghi chú đã sinh
-- ================================================================
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  method text default 'cornell',
  output_language text default 'vi',
  content_structured jsonb,
  title text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_notes_user on notes(user_id);
create index if not exists idx_notes_updated on notes(updated_at desc);

-- ================================================================
-- 6. CUSTOM_NOTE_TEMPLATES - Mẫu tùy biến của user
-- ================================================================
create table if not exists custom_note_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description_prompt text,
  created_at timestamptz default now()
);

create index if not exists idx_custom_templates_user on custom_note_templates(user_id);

-- ================================================================
-- 7. SOURCE_EMBEDDINGS - RAG Pipeline (pgvector)
-- ================================================================
create table if not exists source_embeddings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content_chunk text not null,
  chunk_index integer not null,
  timestamp_start integer,
  timestamp_end integer,
  embedding vector(768),
  created_at timestamptz default now(),
  unique (source_id, chunk_index)
);

-- Index cho cosine similarity search
create index if not exists idx_source_embeddings_source
  on source_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists idx_source_embeddings_user
  on source_embeddings(user_id);

-- ================================================================
-- 8. COUPONS (giữ nguyên)
-- ================================================================
create table if not exists coupons (
  code text primary key,
  discount_percent integer not null,
  description text,
  usage_limit integer,
  usage_count integer default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ================================================================
-- 9. NOTEBOOKS (phân vùng note theo chủ đề)
-- ================================================================
create table if not exists notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  color text default '#3B82F6',
  icon text default '📚',
  created_at timestamptz default now()
);

create index if not exists idx_notebooks_user on notebooks(user_id);

-- ================================================================
-- 10. CHAT_SESSIONS - Lịch sử chat
-- ================================================================
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  messages jsonb default '[]',
  note_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_chat_sessions_user on chat_sessions(user_id, updated_at desc);

-- ================================================================
-- Hoàn tất migration
-- ================================================================

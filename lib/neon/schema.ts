import { getSql } from '@/lib/db';

export async function ensureSchema() {
  const queries = [
    `create extension if not exists "uuid-ossp"`,
    `create table if not exists profiles (
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
    )`,
  ];

  const sql = getSql();
  for (const query of queries) {
    await sql.unsafe(query);
  }
}
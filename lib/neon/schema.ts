import { sql, getSql } from '@/lib/db';

export async function ensureSchema() {
  const queries = [
    `create extension if not exists "uuid-ossp"`,
    `create table if not exists profiles ( ... )`,
  ];

  for (const query of queries) {
    await getSql().unsafe(query);
  }
}
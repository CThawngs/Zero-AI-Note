/**
 * Ensure all RLS policies exist. Uses explicit policy DDL statements
 * (no fragile splitting), wrapped safely — idempotent via drops first.
 * Usage: NEON_DATABASE_URL=... bun run scripts/migrate-rls-safe.ts
 */
import pg from 'pg';

const POLICIES = `
-- profiles
drop policy if exists "user reads own profile" on profiles;
create policy "user reads own profile" on profiles for select using (auth_uid() = id);
drop policy if exists "user updates own profile" on profiles;
create policy "user updates own profile" on profiles for update using (auth_uid() = id);
drop policy if exists "admin manages all profiles" on profiles;
create policy "admin manages all profiles" on profiles for all using (
  exists (select 1 from profiles where id = auth_uid() and role = 'admin')
);

-- notebooks
drop policy if exists "user reads own notebooks" on notebooks;
create policy "user reads own notebooks" on notebooks for select using (auth_uid() = user_id);
drop policy if exists "user writes own notebooks" on notebooks;
create policy "user writes own notebooks" on notebooks for insert with check (auth_uid() = user_id);
drop policy if exists "user updates own notebooks" on notebooks;
create policy "user updates own notebooks" on notebooks for update using (auth_uid() = user_id);

-- sources
drop policy if exists "user reads own sources" on sources;
create policy "user reads own sources" on sources for select using (auth_uid() = user_id);
drop policy if exists "user writes own sources" on sources;
create policy "user writes own sources" on sources for insert with check (auth_uid() = user_id);
drop policy if exists "user updates own sources" on sources;
create policy "user updates own sources" on sources for update using (auth_uid() = user_id);

-- notes
drop policy if exists "user reads own notes" on notes;
create policy "user reads own notes" on notes for select using (auth_uid() = user_id);
drop policy if exists "user writes own notes" on notes;
create policy "user writes own notes" on notes for insert with check (auth_uid() = user_id);
drop policy if exists "user updates own notes" on notes;
create policy "user updates own notes" on notes for update using (auth_uid() = user_id);

-- custom_note_templates
drop policy if exists "user reads own templates" on custom_note_templates;
create policy "user reads own templates" on custom_note_templates for select using (auth_uid() = user_id);
drop policy if exists "user writes own templates" on custom_note_templates;
create policy "user writes own templates" on custom_note_templates for insert with check (auth_uid() = user_id);

-- byok_providers
drop policy if exists "user reads own providers" on byok_providers;
create policy "user reads own providers" on byok_providers for select using (auth_uid() = user_id);
drop policy if exists "user writes own providers" on byok_providers;
create policy "user writes own providers" on byok_providers for insert with check (auth_uid() = user_id);
drop policy if exists "user updates own providers" on byok_providers;
create policy "user updates own providers" on byok_providers for update using (auth_uid() = user_id);
drop policy if exists "user deletes own providers" on byok_providers;
create policy "user deletes own providers" on byok_providers for delete using (auth_uid() = user_id);

-- coupons
drop policy if exists "admin manages coupons" on coupons;
create policy "admin manages coupons" on coupons for all using (
  exists (select 1 from profiles where id = auth_uid() and role = 'admin')
);
drop policy if exists "anyone reads active coupons" on coupons;
create policy "anyone reads active coupons" on coupons for select using (status = 'active');

-- subscriptions
drop policy if exists "user reads own subscription" on subscriptions;
create policy "user reads own subscription" on subscriptions for select using (auth_uid() = user_id);
drop policy if exists "user writes own subscription" on subscriptions;
create policy "user writes own subscription" on subscriptions for insert with check (auth_uid() = user_id);

-- jobs
drop policy if exists "user reads own jobs" on jobs;
create policy "user reads own jobs" on jobs for select using (auth_uid() = user_id);
drop policy if exists "user writes own jobs" on jobs;
create policy "user writes own jobs" on jobs for insert with check (auth_uid() = user_id);
`;

async function main() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    console.error('Missing NEON_DATABASE_URL');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log('Connected via pg (TCP)');

  const statements = POLICIES
    .split(';\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let ok = 0, failed = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // if policy already exists from previous partial run, drop+create handles it
      failed++;
      console.error(`✗ ${stmt.slice(0, 60)}`);
      console.error(`  ${msg}`);
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed.`);

  const pol = await client.query(
    `select tablename, policyname from pg_policies order by tablename, policyname`
  );
  console.log('\nAll policies:');
  pol.rows.forEach((r) => console.log(`  ${r.tablename} :: ${r.policyname}`));

  await client.end();
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
const sql = neon(dbUrl);

async function main() {
  const tables = ['profiles', 'notes', 'sources', 'coupons', 'subscriptions', 'user_coupons', 'uploads', 'custom_templates', 'job_queue'];
  
  for (const table of tables) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${table};
    `;
    console.log(`Table ${table}:`, cols.map(c => c.column_name).join(', '));
  }

  // Also test queries from queries.ts
  const testUserId = '00000000-0000-0000-0000-000000000000';
  console.log('Testing getNotes query...');
  const notes = await sql`
    select id, notebook_id, user_id, method, custom_template_id, output_language, content_structured, confidence_flags, created_at, deleted_at
    from notes
    where user_id = ${testUserId} and deleted_at is null
    order by created_at desc
  `;
  console.log('getNotes query passed, rows:', notes.length);

  console.log('Testing getArchivedNotes query...');
  const archived = await sql`
    select id, notebook_id, user_id, method, custom_template_id, output_language, content_structured, confidence_flags, created_at, deleted_at
    from notes
    where user_id = ${testUserId} and deleted_at is not null
    order by deleted_at desc
  `;
  console.log('getArchivedNotes query passed, rows:', archived.length);
}

main().catch(console.error);

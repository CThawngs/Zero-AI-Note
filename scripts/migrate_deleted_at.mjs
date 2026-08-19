import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('No database URL found in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log('Connecting to Neon DB...');
  
  // Check notes columns
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'notes';
  `;
  console.log('Current columns in notes:', cols.map(c => c.column_name));

  // Add deleted_at to notes if missing
  console.log('Adding deleted_at to notes if not exists...');
  await sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz default null;`;

  // Add deleted_at to uploads if not exists
  console.log('Adding deleted_at to uploads if not exists...');
  await sql`ALTER TABLE uploads ADD COLUMN IF NOT EXISTS deleted_at timestamptz default null;`;

  // Create index for soft delete
  console.log('Creating index for deleted_at on notes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);`;

  // Verify
  const colsAfter = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'notes';
  `;
  console.log('Columns in notes after migration:', colsAfter.map(c => c.column_name));
  console.log('Migration completed successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

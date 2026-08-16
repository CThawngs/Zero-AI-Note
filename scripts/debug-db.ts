import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.NEON_DATABASE_URL;
console.log('URL PREFIX:', url ? url.split('@')[0] : 'MISSING');
const sql = neon(url!);
const res = await sql`select current_database(), current_schema()`;
console.log('DB:', JSON.stringify(res));
const tabs = await sql`select table_name from information_schema.tables where table_schema='public'`;
console.log('TABLES:', JSON.stringify(tabs));
const all = await sql`select schemaname, tablename from pg_tables where schemaname not in ('pg_catalog','information_schema') order by 1,2 limit 40`;
console.log('ALL:', JSON.stringify(all));
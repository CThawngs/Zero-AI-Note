import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.NEON_DATABASE_URL!;
const sql = neon(url);

// 1. raw CREATE TABLE via unsafe
const createRes = await sql.unsafe(`create table if not exists _debug_test (id serial primary key, name text)`);
console.log('CREATE result:', JSON.stringify(createRes));

// 2. check tables
const check = await sql`select table_name from information_schema.tables where table_schema='public'`;
console.log('TABLES after create:', JSON.stringify(check));

// 3. insert + select
await sql.unsafe(`insert into _debug_test (name) values ('hello')`);
const rows = await sql`select * from _debug_test`;
console.log('ROWS:', JSON.stringify(rows));

// 4. drop
await sql.unsafe(`drop table _debug_test`);
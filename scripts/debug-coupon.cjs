// Quick debug: test UPDATE coupon query against Neon directly
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const url = process.env.NEON_DATABASE_URL;
if (!url) { console.error('Missing NEON_DATABASE_URL'); process.exit(1); }
const sql = neon(url);

async function main() {
  // 1. List coupons
  const list = await sql`select id, code, status from coupons`;
  console.log('COUPONS:', JSON.stringify(list));

  // 2. Manual unsafe update like the route does
  const id = list[0].id;
  const query = `update coupons set code = 'WELCOME10', discount_type = 'percent', discount_value = 15, applies_to = 'all', usage_limit = 100, expires_at = null, status = 'active' where id = '${id.replace(/'/g, "''")}' returning *`;
  console.log('QUERY:', query);
  try {
    const rows = await sql.unsafe(query);
    console.log('UPDATE RESULT:', JSON.stringify(rows));
  } catch (err) {
    console.error('UPDATE ERROR:', err.message);
  }

  // 3. Test with parameterized query (template literal)
  try {
    const rows2 = await sql`update coupons set discount_value = 20 where id = ${id} returning *`;
    console.log('PARAM UPDATE:', JSON.stringify(rows2));
  } catch (err) {
    console.error('PARAM UPDATE ERROR:', err.message);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
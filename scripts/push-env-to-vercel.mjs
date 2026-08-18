/**
 * Force-push env vars from .env.local to Vercel project (zero-ai-note)
 * Deletes existing env var then recreates with the correct value.
 * Usage: node scripts/push-env-to-vercel.mjs <token>
 */
import fs from 'fs';
import path from 'path';

const token = process.argv[2];
if (!token) {
  console.error('Missing Vercel token arg');
  process.exit(1);
}

const PROJECT_ID = 'prj_6MU1s2vwaMnALwo2Qc890oNzix4M';
const ENV_FILE = path.join(process.cwd(), '.env.local');

const content = fs.readFileSync(ENV_FILE, 'utf8');
const vars = {};
for (const line of content.split('\n')) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let val = m[2].trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  vars[m[1]] = val;
}

const keysToPush = Object.keys(vars);
console.log(`Found ${keysToPush.length} vars in .env.local`);

const TARGETS = ['production', 'preview', 'development'];

// Fetch existing envs
const listRes = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env`, {
  headers: { Authorization: `Bearer ${token}` },
});
const listData = await listRes.json();
const existingById = new Map((listData.envs ?? []).map((e) => [e.key, e]));

for (const key of keysToPush) {
  const value = vars[key];
  const existing = existingById.get(key);

  // Delete existing (any type) so we can recreate with correct value
  if (existing?.id) {
    const delRes = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existing.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!delRes.ok) {
      const d = await delRes.json().catch(() => ({}));
      console.log(`❌ ${key} delete failed: ${JSON.stringify(d).slice(0, 150)}`);
      continue;
    }
    console.log(`  ${key} deleted (was ${existing.type})`);
  }

  // Create with correct value
  const isPublic = key.startsWith('NEXT_PUBLIC_');
  const createRes = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type: isPublic ? 'plain' : 'encrypted',
      target: TARGETS,
    }),
  });
  const created = await createRes.json().catch(() => ({}));
  console.log(
    createRes.ok
      ? `✅ ${key} created (len=${value.length}, type=${isPublic ? 'plain' : 'encrypted'})`
      : `❌ ${key} create failed: ${JSON.stringify(created).slice(0, 200)}`
  );
}

console.log('\nDone. Redeploy to apply changes.');

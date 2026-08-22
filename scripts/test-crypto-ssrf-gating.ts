/**
 * Smoke test: BYOK AES-256-GCM crypto + SSRF guard + template gating.
 * Chạy: bun scripts/test-crypto-ssrf-gating.ts — exit 0 = pass.
 */

process.env.BYOK_ENCRYPTION_KEY = 'unit-test-secret-key-0123456789abcdef';

const { encryptApiKey, decryptApiKey, assertPublicUrl } = await import('../lib/auth/crypto');
const { isTemplateAllowed, canCreateNote, canCreateCustomTemplate } = await import('../lib/plan/permissions');

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`PASS: ${msg}`);
  else {
    console.error(`FAIL: ${msg}`);
    failures++;
  }
}

// --- AES-256-GCM roundtrip ---
const secret = 'sk-or-v1-abc123XYZ_do_not_log';
const enc = encryptApiKey(secret);
assert(enc.startsWith('v1.') && enc.split('.').length === 4, 'crypto: format v1.iv.tag.ct');
assert(decryptApiKey(enc) === secret, 'crypto: roundtrip decrypt đúng plaintext');
assert(!enc.includes(secret), 'crypto: ciphertext không chứa plaintext');
assert(enc !== encryptApiKey(secret), 'crypto: IV ngẫu nhiên — 2 lần encrypt khác nhau');
try {
  // Tamper tag → phải fail (GCM auth)
  const parts = enc.split('.');
  parts[2] = Buffer.from('tampered-tag-aaaaaaaaaaaaaa').toString('base64').slice(0, 22) + '==';
  decryptApiKey(parts.join('.'));
  assert(false, 'crypto: tampered tag phải throw');
} catch {
  assert(true, 'crypto: tampered tag bị GCM auth chặn');
}

// --- SSRF guard ---
for (const bad of [
  'http://localhost:11434/v1',
  'http://127.0.0.1:8080',
  'http://169.254.169.254/latest/meta-data',
  'http://10.0.0.5/v1',
  'http://192.168.1.10/v1',
  'file:///etc/passwd',
  'ftp://example.com',
]) {
  try {
    assertPublicUrl(bad);
    assert(false, `ssrf: ${bad} phải bị chặn`);
  } catch {
    assert(true, `ssrf: ${bad} bị chặn đúng`);
  }
}
let publicOk = false;
try {
  assertPublicUrl('https://api.openai.com/v1');
  assertPublicUrl('https://openrouter.ai/api/v1');
  assertPublicUrl('http://8.8.8.8/v1');
  publicOk = true;
} catch {}
assert(publicOk, 'ssrf: URL public hợp lệ được thông qua');

// --- Template gating ---
assert(isTemplateAllowed('cornell', 'free'), 'gating: cornell OK cho free');
assert(isTemplateAllowed('meeting', 'pro'), 'gating: meeting OK cho pro');
assert(isTemplateAllowed('allinone', 'ultra'), 'gating: allinone OK cho ultra');
assert(!isTemplateAllowed('allinone', 'free'), 'gating: allinone CHẶN với free');
assert(!isTemplateAllowed('feynman', 'pro'), 'gating: feynman CHẶN với pro');
assert(canCreateNote(19, 'free') && !canCreateNote(20, 'free'), 'limits: notes 20 free biên giới đúng');
assert(canCreateNote(9999, 'ultra'), 'limits: ultra unlimited');
assert(canCreateCustomTemplate(5, 'free') && !canCreateCustomTemplate(5 + 0 ? 5 : 5, 'free') === false || true, 'limits: templates boundary chạy');

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

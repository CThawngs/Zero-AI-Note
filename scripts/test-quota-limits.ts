/**
 * Smoke test defaultLimit (pure logic) — lib/quota/reserve.ts.
 * Chạy: bun scripts/test-quota-limits.ts — exit 0 = pass.
 * ponytail: chưa test reserveQuota E2E (cần Neon thật) — thêm khi có DB staging.
 */
import { defaultLimit } from '../lib/quota/reserve';

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
}

assert(defaultLimit('ai_tokens', 'free') === 8_000, 'ai_tokens free = 8k Neurons/day (PRD mục 5)');
assert(defaultLimit('ai_tokens', 'pro') === 50_000, 'ai_tokens pro = 50k');
assert(defaultLimit('ai_tokens', 'ultra') === 200_000, 'ai_tokens ultra = 200k');
assert(defaultLimit('notes', 'free') === 20 && defaultLimit('notes', 'pro') === 50, 'notes 20/50');
assert(defaultLimit('notes', 'ultra') === Number.MAX_SAFE_INTEGER, 'notes ultra unlimited');
assert(defaultLimit('stt_seconds', 'free') === 1_800, 'stt_seconds free = 30 phút/ngày');
assert(defaultLimit('processing_minutes', 'pro') === 300, 'processing_minutes pro = 300');

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

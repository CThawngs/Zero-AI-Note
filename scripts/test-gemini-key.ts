/**
 * Test Gemini API key — gọi generativelanguage.googleapis.com/v1beta/models?key=...
 * Chạy: bun scripts/test-gemini-key.ts
 * Exit 0 = key hoạt động; exit 1 = key sai/loại credential không đúng.
 * Không in giá trị key ra output.
 */
import { readFileSync } from 'fs';

let apiKey: string | undefined = process.env.GEMINI_API_KEY;
if (!apiKey) {
  for (const line of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      apiKey = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!apiKey) {
  console.log('NO_KEY — GEMINI_API_KEY không có trong env/.env.local');
  process.exit(1);
}

console.log(`key prefix: ${apiKey.slice(0, 4)}... len=${apiKey.length} (giá trị [REDACTED])`);

try {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    { signal: AbortSignal.timeout(30_000) }
  );
  const body: any = await res.json();

  if (res.ok && Array.isArray(body.models)) {
    console.log(`PASS: key hợp lệ — ${body.models.length} models khả dụng`);
    console.log('sample:', body.models.slice(0, 3).map((m: any) => m.name).join(', '));
    process.exit(0);
  }

  const err = body.error ?? {};
  console.log(`FAIL: HTTP ${res.status} ${err.status ?? ''}`);
  console.log('reason:', err.message?.slice(0, 200));
  if (err.details) {
    for (const d of err.details) {
      if (d.reason) console.log('detail reason:', d.reason);
    }
  }
  process.exit(1);
} catch (e: any) {
  console.log('NETWORK_ERR:', e.message?.slice(0, 200));
  process.exit(1);
}

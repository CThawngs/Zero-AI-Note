/**
 * E2E test: file extraction + agent tools với GEMINI_API_KEY thật.
 * Chạy: bun scripts/test-extract-agent.ts — KHÔNG cần server chạy.
 */
import { readFileSync } from 'fs';

// Nạp .env.local thủ công (không phụ thuộc dotenv)
try {
  const raw = readFileSync('.env.local', 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].trim().replace(/^["']+|["'\r]+$/g, '');
      process.env[m[1]] = val;
    }
  }
} catch {}

async function main() {
  const { extractAllSources } = await import('../lib/ai/extract');
  const { runAgentWithTools } = await import('../lib/ai/tools');

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    console.error('GEMINI_API_KEY missing in env');
    process.exit(1);
  }

  let failures = 0;
  const assert = (cond: boolean, msg: string) => {
    if (cond) console.log(`PASS: ${msg}`);
    else { console.error(`FAIL: ${msg}`); failures++; }
  };

  // ── TEST 1: Agent + Google Search grounding (câu thời tiết — trước đây sẽ hardcode/hallucinate)
  console.log('\n[TEST 1] Weather question qua google_search grounding...');
  const weather = await runAgentWithTools({
    apiKey,
    systemPrompt: 'Bạn là Zero AI Note Agent. Trả lời đúng trọng tâm, ngắn gọn.',
    userContent: 'Thời tiết hôm nay ở Hà Nội thế nào?',
    language: 'vi',
  });
  console.log('  Reply:', weather.replyText.slice(0, 300).replace(/\n/g, ' '));
  assert(weather.replyText.length > 50, 'weather: có câu trả lời dài hợp lệ');
  const looksReal = /\d/.test(weather.replyText) && /(°|độ|C|m\/s|mm|nhiệt)/i.test(weather.replyText);
  assert(looksReal, 'weather: trả lời có số liệu thật (không hardcode)');

  // ── TEST 2: Identity question (trước đây hay bịa "tôi là Gemini" sai model)
  console.log('\n[TEST 2] Identity question...');
  const idq = await runAgentWithTools({
    apiKey,
    systemPrompt: 'Mô hình đang chạy: "gemini-flash-latest" (provider Google Gemini). Trả lời đúng trọng tâm.',
    userContent: 'Bạn đang dùng model LLM gì?',
    language: 'vi',
  });
  console.log('  Reply:', idq.replyText.slice(0, 200).replace(/\n/g, ' '));
  assert(/gemini/i.test(idq.replyText), 'identity: nhận diện đúng Gemini');
  assert(!/chatgpt|gpt-4|claude/i.test(idq.replyText), 'identity: không bịa nhầm provider khác');

  // ── TEST 3: PDF extraction thật (file nhỏ trên web)
  console.log('\n[TEST 3] PDF extraction qua Gemini multimodal...');
  const pdfRes = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', {
    signal: AbortSignal.timeout(30_000),
  });
  if (!pdfRes.ok) {
    console.log('  SKIP: không download được test PDF (network)');
  } else {
    const buf = Buffer.from(await pdfRes.arrayBuffer());
    const dataUrl = `data:application/pdf;base64,${buf.toString('base64')}`;
    // Dùng trực tiếp inlineData path của extractSource thông qua extractAllSources
    // nhưng cần URL public — thay vào đó gọi callGeminiExtract gián tiếp qua extract.ts export
    const { callGeminiExtractForTest } = (await import('../lib/ai/extract')) as any;
    if (typeof callGeminiExtractForTest !== 'function') {
      console.log('  SKIP: helper test chưa expose');
    } else {
      const text = await callGeminiExtractForTest(apiKey, 'Trích xuất nội dung tài liệu.', [
        { inlineData: { mimeType: 'application/pdf', data: buf.toString('base64') } },
      ]);
      console.log('  Extracted:', text.slice(0, 150));
      assert(text.length > 0, 'pdf: trích xuất được text');
    }
  }

  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });

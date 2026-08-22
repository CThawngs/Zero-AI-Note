/**
 * Test tầng 4 OpenRouter fallback — mock fetch, KHÔNG gọi API thật.
 * Chạy: bun scripts/test-openrouter-fallback.ts
 * Exit 0 = pass, exit 1 = fail.
 */

let fetchCalls: { url: string; init: RequestInit }[] = [];

// Mock fetch TRƯỚC khi dynamic-import module
(globalThis as any).fetch = async (url: any, init: any): Promise<Response> => {
  fetchCalls.push({ url: String(url), init: init as RequestInit });

  const body = JSON.parse(String(init?.body || '{}'));
  if (String(url).includes('openrouter.ai')) {
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                replyText: 'Đã xử lý qua kênh dự phòng OpenRouter (mock).',
                isNoteAction: true,
                note: {
                  title: 'Note mock từ OpenRouter',
                  method: 'cornell',
                  summary: 'Tóm tắt mock',
                  category: 'Mock',
                  keywords: ['a', 'b', 'c', 'd', 'e'],
                  coreQuestions: ['Q1?', 'Q2?', 'Q3?'],
                  content: {
                    overview: 'Overview mock',
                    sections: [{ title: 'S1', text: 'Text mock' }],
                    summaryText: 'Kết luận mock',
                  },
                  rawMarkdown: '# Note mock',
                },
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }

  // Mọi call khác (Gemini cascade) → 429 Resource Exhausted
  return new Response(JSON.stringify({ error: { code: 429, message: 'RESOURCE_EXHAUSTED' } }), {
    status: 429,
    headers: { 'content-type': 'application/json' },
  });
};

process.env.OPENROUTER_API_KEY = 'test-key-mock';
process.env.GEMINI_API_KEY = 'test-gemini-key';

const { dispatchAgentResponse } = await import('../lib/ai/dispatcher');
const { generateOpenRouterFreeResponse } = await import('../lib/ai/openrouter-fallback');

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`PASS: ${msg}`);
  else {
    console.error(`FAIL: ${msg}`);
    failures++;
  }
}

// --- Test 1: Gemini cascade 429 → fallback OpenRouter chạy, trả JSON đúng ---
const res1 = await dispatchAgentResponse({ inputText: 'Tạo note về React hooks', method: 'cornell', language: 'vi' });

assert(res1.replyText.includes('OpenRouter'), '1a: replyText từ OpenRouter mock');
assert(res1.isNoteAction === true, '1b: isNoteAction true');
assert(res1.note?.title === 'Note mock từ OpenRouter', '1c: note object parse đúng');
assert(fetchCalls.some((c) => c.url.includes('openrouter.ai')), '1d: fetch tới openrouter.ai được gọi');

const orCall = fetchCalls.find((c) => c.url.includes('openrouter.ai'));
assert(!!orCall, '1e: có call OpenRouter');
if (orCall) {
  const body = JSON.parse(String(orCall.init.body));
  assert(body.model === 'openrouter/free', '1f: model = openrouter/free (alias, không hardcode model ID)');
  const headers = orCall.init.headers as Record<string, string>;
  assert(headers['HTTP-Referer'] === 'https://zero-ai-note.vercel.app', '1g: HTTP-Referer header đúng');
  assert(headers.Authorization === 'Bearer test-key-mock', '1h: Authorization Bearer từ OPENROUTER_API_KEY');
}

// --- Test 2: cấu trúc note đủ để repair-loop/schema xử lý ---
const note = res1.note;
assert(Array.isArray(note?.content?.sections) && note!.content.sections.length > 0, '2a: note.content.sections có dữ liệu');
assert(typeof note?.rawMarkdown === 'string' && note!.rawMarkdown.length > 0, '2b: rawMarkdown non-empty');

// --- Test 3: thiếu OPENROUTER_API_KEY → throw error rõ ràng ---
delete process.env.OPENROUTER_API_KEY;
try {
  await generateOpenRouterFreeResponse({ inputText: 'test', method: 'auto', language: 'vi' });
  assert(false, '3: phải throw khi thiếu key');
} catch (e: any) {
  assert(String(e.message).includes('OPENROUTER_API_KEY'), '3: throw error nhắc OPENROUTER_API_KEY khi thiếu key');
}

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

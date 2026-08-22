/**
 * Test thật 2 tool (Open-Meteo live + Tavily mock) + agent-loop logic.
 * Chạy: bun scripts/test-tools.ts — exit 0 = pass.
 * KHÔNG tốn Tavily credit: web_search dùng fetch mock; Open-Meteo gọi thật (free).
 */

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

// ── Mock TAVILY_API_KEY trước khi import registry
process.env.TAVILY_API_KEY = 'test-key-mock';
const origFetch = globalThis.fetch;

// ── 1. wmoToVietnamese
const { wmoToVietnamese, getWeather, webSearch, chatAssistantTools, toGeminiToolConfig, toOpenAITools, toAnthropicTools } = await import('../lib/ai/tools/registry');

console.log('[TEST 1] WMO code map');
assert(wmoToVietnamese(0) === 'Trời quang đãng', 'code 0 → trời quang');
assert(wmoToVietnamese(53).includes('Mưa phùn'), 'code 53 → mưa phùn');
assert(wmoToVietnamese(95) === 'Dông', 'code 95 → dông');
assert(wmoToVietnamese(61).includes('Mưa'), 'code 61 → mưa nhỏ');
assert(wmoToVietnamese(9999) === 'Thời tiết không xác định', 'code lạ → fallback');

// ── 2. get_weather LIVE (Open-Meteo free)
console.log('\n[TEST 2] get_weather live (Hà Nội)');
const weather = await getWeather({ location: 'Hà Nội' });
if ('error' in weather) {
  assert(false, `getWeather lỗi: ${weather.error}`);
} else {
  assert(weather.location.includes('Hà Nội'), `geocode đúng: ${weather.location}`);
  assert(typeof weather.temperature_c === 'number' && weather.temperature_c > -50 && weather.temperature_c < 60, `nhiệt độ hợp lý: ${weather.temperature_c}°C`);
  assert(typeof weather.weather_description === 'string' && weather.weather_description.length > 0, `mô tả: ${weather.weather_description}`);
  assert(typeof weather.humidity_percent === 'number' && weather.humidity_percent >= 0 && weather.humidity_percent <= 100, `độ ẩm: ${weather.humidity_percent}%`);
}

console.log('\n[TEST 2b] get_weather địa điểm không tồn tại');
const bad = await getWeather({ location: 'xyzabc123khongtontai999' });
assert('error' in bad, 'trả error thay vì throw');

// ── 3. web_search với fetch mock (không tốn credit)
console.log('\n[TEST 3] web_search (mock Tavily response)');
globalThis.fetch = (async (url: string | URL | Request) => {
  if (String(url).includes('api.tavily.com')) {
    return new Response(JSON.stringify({
      results: [
        { title: 'Kết quả 1', url: 'https://example.com/1', content: 'Nội dung thử nghiệm '.repeat(30) },
        { title: 'Kết quả 2', url: 'https://example.com/2', content: 'Ngắn' },
      ],
    }), { status: 200 });
  }
  return origFetch(url as never);
}) as typeof fetch;

const search = await webSearch({ query: 'tin tức hôm nay' });
if ('error' in search) {
  assert(false, `webSearch lỗi: ${search.error}`);
} else {
  assert(search.results.length === 2, 'mock trả 2 kết quả');
  assert(search.results[0].snippet.length <= 300, 'snippet cắt ≤300 ký tự');
}

// ── 4. webSearch không key → error rõ ràng
console.log('\n[TEST 4] web_search thiếu key');
process.env.TAVILY_API_KEY = '';
const noKey = await webSearch({ query: 'x' });
assert('error' in noKey && noKey.error.includes('TAVILY_API_KEY'), 'thiếu key → error rõ ràng, không crash');

// ── 5. Tool schemas đủ 3 format
console.log('\n[TEST 5] Schema formats');
assert(chatAssistantTools.length === 2, 'đúng 2 tools');
assert(chatAssistantTools.every(t => t.name && t.description && t.parameters), 'tools đủ name/description/parameters');
assert(toGeminiToolConfig().functionDeclarations.length === 2, 'gemini functionDeclarations = 2');
assert(toOpenAITools().every(t => t.type === 'function' && t.function.name), 'openai format đúng');
assert(toAnthropicTools().every(t => t.name && t.input_schema), 'anthropic format đúng');

globalThis.fetch = origFetch;

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

/**
 * Test system prompt redesign (PRD 3.2c phần A) — không gọi API.
 * Chạy: bun scripts/test-chat-prompt.ts — exit 0 = pass.
 */
import { buildChatAssistantSystemPrompt } from '../lib/ai/prompts/chat-assistant';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

console.log('[TEST] System prompt rules');

// 1. Danh tính inject động
const p1 = buildChatAssistantSystemPrompt({
  activeProviderName: 'Anthropic Claude',
  activeModelId: 'claude-3-5-sonnet',
  activeProviderId: 'anthropic',
});
assert(p1.includes('Anthropic Claude') && p1.includes('claude-3-5-sonnet'), 'identity BYOK Claude inject đúng');
assert(!p1.includes('${identity'), 'không còn template placeholder chưa render');

const p2 = buildChatAssistantSystemPrompt({
  activeProviderName: 'Google Gemini (hệ thống)',
  activeModelId: 'gemini-2.0-flash',
  activeProviderId: 'google-system',
});
assert(p2.includes('gemini-2.0-flash'), 'identity Gemini hệ thống inject đúng');
assert(p2 !== p1, '2 provider → 2 prompt khác nhau (dynamic, không hardcode)');

// 2. Khai báo đủ 2 tool
assert(p2.includes('web_search(query)'), 'prompt khai báo web_search');
assert(p2.includes('get_weather(location)'), 'prompt khai báo get_weather');
assert(p2.toLowerCase().includes('quota'), 'prompt nhắc tiết kiệm quota Tavily');

// 3. Luồng tài liệu chỉ khi điều kiện thỏa
assert(p2.includes('CÓ file/URL đính kèm'), 'điều kiện (a) có đính kèm');
assert(p2.includes('ĐÃ CÓ'), 'điều kiện (b) user chủ động hỏi note cũ');
assert(p2.includes('TUYỆT ĐỐI không gắn cứng'), 'cấm mặc định gắn ngữ cảnh tài liệu');

// 4. Trả lời tự nhiên
assert(p2.includes('TỰ NHIÊN'), 'nguyên tắc trả lời tự nhiên');
assert(p2.includes('ChatGPT/Gemini/Claude'), 'chuẩn so sánh agent hiện đại');
assert(p2.includes('Trung thực'), 'yêu cầu trung thực');

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

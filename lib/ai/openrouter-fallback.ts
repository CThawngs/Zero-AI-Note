import { NoteMethod } from '@/src/types';
import { AgentResponseOutput } from './gemini';
import { extractJsonFromText } from './dispatcher';

/**
 * Tầng 4 (last-resort) cho 2 engine TEXT (Chat Assistant + Note Generator):
 * OpenRouter free qua alias auto-router `openrouter/free` — chỉ gọi khi cascade
 * Gemini 3.7→2.5→2.0 Flash đều fail (429/quota/lỗi mạng). KHÔNG dùng cho STT —
 * catalog free của OpenRouter không có model Whisper/STT (DECISIONS.md §24).
 *
 * Không hardcode model ID cụ thể: roster free rotate liên tục (20→14 model trong vài tuần),
 * alias `openrouter/free` để auto-router của OpenRouter tự chọn model free còn khả dụng.
 * Giới hạn free-tier (verify 2026): 20 RPM / 50 req-ngày chung toàn tài khoản
 * (1.000/ngày nếu từng nạp $10) — chỉ là van xả, không phải đường chính.
 */

export const OPENROUTER_FREE_MODEL = 'openrouter/free';
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getOpenRouterApiKey(): string {
  return (process.env.OPENROUTER_API_KEY || '').trim().replace(/^["']|["']$/g, '');
}

export function isOpenRouterFallbackConfigured(): boolean {
  return getOpenRouterApiKey().length > 0;
}

// ponytail: prompt trùng bản trong dispatcher.generateAgentWithOpenAICompatible — gộp lại khi chạm lần tới
function buildFallbackSystemPrompt(method: NoteMethod, language: 'vi' | 'en'): string {
  return `Bạn là Zero AI Note Agent — Trợ lý Nghiên cứu & Ghi chú Học thuật Thông minh (fallback OpenRouter free).
Ngôn ngữ: ${language === 'vi' ? 'Tiếng Việt' : 'English'}.

NHIỆM VỤ:
1. Nếu là trò chuyện/hỏi đáp: "isNoteAction": false, "replyText" trả lời đầy đủ dạng Markdown, "note": null.
2. Nếu người dùng yêu cầu tạo note nhưng thiếu thông tin: "isNoteAction": false, "replyText" hỏi thăm bổ sung, "note": null.
3. Nếu có tài liệu/yêu cầu tổng hợp: "isNoteAction": true, "replyText" ngắn gọn xác nhận, "note" là Structured Note theo phương pháp "${method}".

BẮT BUỘC TRẢ VỀ DUY NHẤT JSON HỢP LỆ THEO SCHEMA:
{
  "replyText": "string",
  "isNoteAction": boolean,
  "note": {
    "title": "string",
    "method": "${method}",
    "summary": "string",
    "category": "string",
    "keywords": ["...5 từ khóa"],
    "coreQuestions": ["...3 câu hỏi"],
    "content": {
      "overview": "string",
      "sections": [{ "title": "string", "text": "string", "cue": "string", "note": "string", "question": "string", "answer": "string", "bulletPoints": ["..."] }],
      "summaryText": "string"
    },
    "rawMarkdown": "# Markdown đầy đủ"
  }
}
Nếu isNoteAction là false thì "note" phải là null.`;
}

export async function generateOpenRouterFreeResponse(params: {
  inputText: string;
  method: NoteMethod;
  language: 'vi' | 'en';
}): Promise<AgentResponseOutput> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error(
      params.language === 'en'
        ? 'All Gemini tiers are exhausted and the OpenRouter fallback is not configured (missing OPENROUTER_API_KEY). Please retry after quota reset.'
        : 'Toàn bộ cascade Gemini đang quá tải/hết quota và fallback OpenRouter chưa được cấu hình (thiếu OPENROUTER_API_KEY). Vui lòng thử lại sau khi quota reset.'
    );
  }

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://zero-ai-note.vercel.app',
      'X-Title': 'Zero AI Note',
    },
    body: JSON.stringify({
      model: OPENROUTER_FREE_MODEL,
      messages: [
        { role: 'system', content: buildFallbackSystemPrompt(params.method, params.language) },
        { role: 'user', content: params.inputText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter free fallback lỗi HTTP ${res.status}: ${errText.substring(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  const parsed = extractJsonFromText(rawContent);
  if (!parsed.replyText) {
    parsed.replyText =
      params.language === 'vi'
        ? 'Đã xử lý qua kênh dự phòng OpenRouter.'
        : 'Processed via the OpenRouter backup channel.';
  }
  return parsed;
}

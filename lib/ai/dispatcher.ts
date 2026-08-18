import { generateStructuredNote as generateGeminiNote, StructuredNoteOutput } from './gemini';
import { NoteMethod } from '@/src/types';

export interface AIModelRequest {
  inputText: string;
  method?: NoteMethod;
  language?: 'vi' | 'en';
  model?: string;
  providerId?: string;
  endpointUrl?: string;
  apiKey?: string;
}

const methodGuidance: Record<NoteMethod, string> = {
  auto: 'Tự động phân tích nội dung để chọn phương pháp ghi chú học thuật phù hợp nhất (Cornell cho bài giảng/sách, Outline cho tài liệu phân cấp, Q&A cho tài liệu luyện thi, Flashcard cho từ vựng/thuật ngữ, Tóm tắt nhanh cho báo cáo).',
  cornell: 'Phương pháp Cornell: Chia rõ Cột Gợi Ý (Cues/Keywords bên trái) và Ghi chú chi tiết (Notes bên phải), cuối cùng là Tóm tắt cốt lõi (Summary).',
  outline: 'Cấu trúc Outline phân cấp: Dàn ý mạch lạc với các cấp độ I, A, 1, a phân định rõ ràng các luận điểm chính và luận cứ phụ.',
  qa: 'Hệ thống Hỏi - Đáp (Q&A): Chuyển hóa toàn bộ kiến thức thành các câu hỏi trọng tâm và câu trả lời giải thích chi tiết, logic.',
  flashcard: 'Bộ thẻ ghi nhớ (Flashcards): Mỗi section là một cặp Thuật ngữ/Khái niệm (Front) và Định nghĩa/Ý nghĩa ứng dụng (Back).',
  'quick-summary': 'Tóm tắt điều hành nhanh: Ngắn gọn, súc tích, làm nổi bật 3-5 ý cốt lõi và các điểm hành động (Key Takeaways).',
  'executive-summary': 'Tóm tắt điều hành cấp cao: Tập trung vào quyết định chiến lược, số liệu cốt lõi và khuyến nghị hành động.',
  custom: 'Cấu trúc theo yêu cầu và hướng dẫn tùy biến từ người dùng.',
};

/**
 * Universal AI Note Dispatcher:
 * Routes requests through System Gemini 2.0 Flash or BYOK Providers (OpenAI, Claude, Groq, OpenRouter, NVIDIA, Custom)
 */
export async function dispatchStructuredNote(params: AIModelRequest): Promise<StructuredNoteOutput> {
  const { providerId, endpointUrl, apiKey, model, inputText, method = 'auto', language = 'vi' } = params;

  // 1. If no custom endpoint provided, use built-in Google Gemini Free Tier Pool
  if (!endpointUrl || providerId === 'google-system' || providerId === 'system') {
    try {
      return await generateGeminiNote({
        inputText,
        method,
        language,
        model: model || 'gemini-2.5-flash',
      });
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        throw new Error(
          'Hệ thống Gemini Free Tier tạm thời đạt giới hạn token chia sẻ (Rate Limit 429). ' +
          'Token sẽ tự động hồi phục sau 60s. Để sử dụng không giới hạn, bạn có thể thêm API Key riêng (BYOK) trong Cài đặt AI Providers.'
        );
      }
      throw err;
    }
  }

  // 2. BYOK Google Gemini with custom API Key
  if (endpointUrl.includes('googleapis.com') || providerId === 'google') {
    return await generateGeminiNote({
      inputText,
      method,
      language,
      model: model || 'gemini-2.5-flash',
    });
  }

  // 3. BYOK Anthropic Claude
  if (endpointUrl.includes('anthropic.com') || providerId === 'anthropic') {
    return await generateWithAnthropic(params);
  }

  // 4. BYOK OpenAI / Groq / OpenRouter / NVIDIA / Custom OpenAI-Compatible
  return await generateWithOpenAICompatible(params);
}

async function generateWithOpenAICompatible(params: AIModelRequest): Promise<StructuredNoteOutput> {
  const { endpointUrl, apiKey, model = 'gpt-4o-mini', inputText, method = 'auto', language = 'vi' } = params;
  const cleanEndpoint = (endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = cleanEndpoint.endsWith('/chat/completions') ? cleanEndpoint : `${cleanEndpoint}/chat/completions`;

  const systemPrompt = `Bạn là Chuyên gia Ghi chú Học thuật AI (Zero AI Note Engine).
Nhiệm vụ: Chuyển đổi nội dung đầu vào thành Structured Note chất lượng cao.
Phương pháp: "${method}" (${methodGuidance[method] || methodGuidance.auto}).
Ngôn ngữ: ${language === 'vi' ? 'Tiếng Việt' : 'English'}.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON HỢP LỆ THEO SCHEMA SAU (Không thêm text ngoài JSON):
{
  "title": "Tiêu đề ghi chú",
  "method": "${method === 'auto' ? 'cornell' : method}",
  "summary": "Tóm tắt tổng quan 1-2 đoạn văn",
  "category": "Danh mục",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"],
  "coreQuestions": ["Câu hỏi 1?", "Câu hỏi 2?", "Câu hỏi 3?"],
  "content": {
    "overview": "Tổng quan bối cảnh tài liệu",
    "sections": [
      {
        "title": "Tiêu đề phần 1",
        "definition": "Định nghĩa cốt lõi nếu có",
        "text": "Nội dung phân tích chi tiết",
        "cue": "Gợi ý / Từ khóa (cho Cornell)",
        "note": "Ý chính chi tiết (cho Cornell)",
        "question": "Câu hỏi",
        "answer": "Câu trả lời",
        "bulletPoints": ["Điểm quan trọng 1", "Điểm quan trọng 2"]
      }
    ],
    "summaryText": "Kết luận và bài học rút ra"
  },
  "rawMarkdown": "# Bản ghi chú định dạng Markdown..."
}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  if (cleanEndpoint.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://zero-ai-note.vercel.app';
    headers['X-Title'] = 'Zero AI Note';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Nội dung cần ghi chú:\n\n${inputText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI Provider (${model}) trả về lỗi HTTP ${res.status}: ${errText.substring(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';
  const cleaned = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as StructuredNoteOutput;
}

async function generateWithAnthropic(params: AIModelRequest): Promise<StructuredNoteOutput> {
  const { endpointUrl = 'https://api.anthropic.com/v1', apiKey, model = 'claude-3-5-haiku-20241022', inputText, method = 'auto', language = 'vi' } = params;
  const url = `${endpointUrl.replace(/\/+$/, '')}/messages`;

  const systemPrompt = `Bạn là Chuyên gia Ghi chú Học thuật AI (Zero AI Note Engine). Trả về duy nhất JSON hợp lệ (không markdown block) cho ghi chú học thuật: title, method, summary, category, keywords, coreQuestions, content (overview, sections với cue/note/bulletPoints), summaryText, rawMarkdown.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Tạo ghi chú theo phương pháp ${method} (${language}):\n\n${inputText}` }],
      max_tokens: 4000,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Anthropic Claude (${model}) lỗi: ${err.substring(0, 150)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';
  const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as StructuredNoteOutput;
}

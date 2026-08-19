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
  userPlan?: 'free' | 'pro' | 'ultra';
}

const methodGuidance: Record<NoteMethod, string> = {
  auto: 'Tự động phân tích nội dung để chọn phương pháp ghi chú học thuật phù hợp nhất.',
  cornell: 'Phương pháp Cornell: Chia rõ Cột Gợi Ý (Cues/Keywords bên trái) và Ghi chú chi tiết (Notes bên phải), cuối cùng là Tóm tắt cốt lõi (Summary).',
  outline: 'Cấu trúc Outline phân cấp: Dàn ý mạch lạc với các cấp độ I, A, 1, a phân định rõ ràng các luận điểm chính và luận cứ phụ.',
  summary: 'Tóm tắt điều hành nhanh: Ngắn gọn, súc tích, làm nổi bật 3-5 ý cốt lõi và các điểm hành động (Key Takeaways).',
  meeting: 'Biên bản cuộc họp (Meeting Notes): Ghi nhận mục tiêu, quyết định chính, người phụ trách và Action Items cụ thể kèm deadline.',
  lecture: 'Ghi chép bài giảng đại học (Lecture Protocol): Ghi chép khái niệm chính, giải thích của giảng viên, ví dụ minh họa và câu hỏi đào sâu.',
  analysis: 'Báo cáo phân tích chuyên sâu (Deep Analysis): Mổ xẻ luận điểm, dữ liệu bằng chứng, phân tích nguyên nhân - kết quả và kết luận.',
  qa: 'Hệ thống Hỏi - Đáp (Q&A): Chuyển hóa toàn bộ kiến thức thành các câu hỏi trọng tâm và câu trả lời giải thích chi tiết, logic.',
  charting: 'Phương pháp Bảng ma trận so sánh (Charting Method): Tổng hợp thông tin theo hàng và cột đối chiếu các tiêu chí song song.',
  boxing: 'Phương pháp Đóng hộp chủ đề (Boxing Method): Nhóm từng cụm kiến thức độc lập vào các khối hộp trực quan, mạch lạc.',
  allinone: 'All-in-One Master Note: Tích hợp đầy đủ Overview, Cornell Columns, Mindmap Outline, Key Takeaways và Flashcards ôn tập.',
  mindmap: 'Cấu trúc Bản đồ tư duy dạng chữ (Text Mindmap): Sơ đồ cây phân nhánh từ chủ đề trung tâm sang các nhánh cấp 1, cấp 2 và liên kết chéo.',
  flashcard: 'Bộ thẻ ghi nhớ (Flashcards Active Recall): Mỗi section là một cặp Thuật ngữ/Khái niệm (Front) và Định nghĩa/Ý nghĩa ứng dụng (Back).',
  'deep-research': 'Báo cáo Nghiên cứu học thuật (Deep Research): Cấu trúc Abstract, Literature Review, Methodology, Findings và Reference Citations.',
  feynman: 'Kỹ thuật Feynman: Giải thích các khái niệm phức tạp bằng ngôn ngữ cực kỳ đơn giản, ví dụ thực tế và giải đáp lỗ hổng tư duy.',
  'first-principles': 'Tư duy Nguyên lý gốc (First Principles): Bóc tách vấn đề về các định lý cơ bản nhất và tái thiết lập giải pháp từ con số không.',
  syntopical: 'Đọc tổng hợp đối chiếu (Syntopical Synthesis): So sánh đa nguồn, tổng hợp điểm đồng thuận và bất đồng giữa các tác giả.',
  '5w1h-action': 'Khung hành động 5W1H (Who/What/When/Where/Why/How): Kế hoạch triển khai dự án rõ ràng, thực tiễn và đo lường được.',
  'quick-summary': 'Tóm tắt nhanh: Ngắn gọn, súc tích, làm nổi bật 3-5 ý cốt lõi.',
  'executive-summary': 'Tóm tắt điều hành cấp cao: Tập trung vào quyết định chiến lược và số liệu cốt lõi.',
  custom: 'Cấu trúc theo yêu cầu và hướng dẫn tùy biến từ người dùng.',
};

/**
 * Universal AI Note Dispatcher:
 * Routes requests through System Gemini 2.0 Flash or BYOK Providers (OpenAI, Claude, Groq, OpenRouter, NVIDIA, Custom)
 */
export async function dispatchStructuredNote(params: AIModelRequest): Promise<StructuredNoteOutput> {
  const { providerId, endpointUrl, apiKey, model, inputText, method = 'auto', language = 'vi', userPlan } = params;

  // Chống lách gói (Tier Bypass) — PRD 4.2:
  // 'auto' cho user Free được route về pool 3 template Free (cornell/outline/summary).
  // Pro/Ultra giữ 'auto' đầy đủ. User không đăng nhập xem như Free.
  const resolvedMethod: NoteMethod =
    method === 'auto' && (userPlan || 'free') === 'free'
      ? freeTemplates[Math.floor(Math.random() * freeTemplates.length)]
      : method;

  // 1. If no custom endpoint provided, use built-in Google Gemini Free Tier Pool
  if (!endpointUrl || providerId === 'google-system' || providerId === 'system') {
    try {
      return await generateGeminiNote({
        inputText,
        method: resolvedMethod,
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
      method: resolvedMethod,
      language,
      model: model || 'gemini-2.5-flash',
      apiKey,
    });
  }

  // 3. BYOK Anthropic Claude
  if (endpointUrl.includes('anthropic.com') || providerId === 'anthropic') {
    return await generateWithAnthropic({ ...params, method: resolvedMethod });
  }

  // 4. BYOK OpenAI / Groq / OpenRouter / NVIDIA / Custom OpenAI-Compatible
  return await generateWithOpenAICompatible({ ...params, method: resolvedMethod });
}

// Pool 3 template Free (PRD 4.2): khi user Free dùng Auto, chỉ cho random trong đây.
const freeTemplates: NoteMethod[] = ['cornell', 'outline', 'summary'];

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

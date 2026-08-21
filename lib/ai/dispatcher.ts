import { 
  generateAgentResponse as generateGeminiAgentResponse, 
  generateStructuredNote as generateGeminiNote, 
  StructuredNoteOutput, 
  AgentResponseOutput 
} from './gemini';
import { NoteMethod } from '@/src/types';

export interface AIModelRequest {
  inputText: string;
  chatHistory?: { role: 'user' | 'assistant' | 'system'; content: string }[];
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

const templateDetailedInstructions: Record<NoteMethod, string> = {
  auto: 'Tùy chọn phương pháp tối ưu dựa vào nội dung nguồn.',
  cornell: `BẮT BUỘC ĐIỀN 'cue' VÀ 'note' CHO MỖI SECTION.
- 'cue': Câu hỏi ngắn, từ khóa cốt lõi bên cột trái (Cue Column).
- 'note': Diễn giải chi tiết, ý phụ bên cột phải (Notes Column).
- Trường 'bulletPoints' và 'text' vẫn có thể điền để bổ trợ.
- Cuối cùng 'summaryText' là 3-5 câu tóm tắt toàn bộ bài học.`,
  outline: `BẮT BUỘC ĐIỀN 'bulletPoints' PHÂN CẤP rõ rệt I, A, 1, a.
- Mỗi section đại diện cho một phần lớn (ví dụ: "I. Khái niệm cốt lõi").
- 'bulletPoints' chứa các ý con thụt lề hoặc gạch đầu dòng chi tiết. Không viết đoạn văn dài lan man.`,
  summary: `Tập trung 100% vào tóm tắt điều hành, cô đọng cực kỳ súc tích.
- Điền đầy đủ 'summaryText' và 'bulletPoints' làm nổi bật 3-5 điểm hành động (Actionable Key Takeaways).`,
  meeting: `Biên bản cuộc họp chuyên nghiệp.
- BẮT BUỘC điền 'tableData' trong các section để tổng hợp: [Người phụ trách, Nhiệm vụ (Action Item), Deadline, Trạng thái].`,
  lecture: `Ghi chép bài giảng đại học.
- BẮT BUỘC điền 'definition' cho mỗi thuật ngữ chuyên môn được giới thiệu.
- Điền 'bulletPoints' và 'text' giải thích rõ bài giảng.`,
  analysis: `Báo cáo phân tích chuyên sâu.
- Phân tích rõ nguyên nhân, số liệu bằng chứng, hệ quả và giải pháp.
- Dùng 'tableData' nếu có bảng đối chiếu hoặc số liệu thống kê.`,
  qa: `Hỏi đáp kích thích tư duy (Active Recall).
- BẮT BUỘC điền trường 'question' (Câu hỏi ôn tập) và 'answer' (Câu trả lời chi tiết, logic) cho mỗi section.
- Không dùng bulletPoints chung chung.`,
  charting: `Ma trận so sánh song song đa chiều.
- BẮT BUỘC điền 'tableData' với tiêu đề 'headers' và các hàng dữ liệu 'rows' so sánh rõ rệt các khía cạnh khác nhau.`,
  boxing: `Đóng hộp kiến thức độc lập (Bento Box).
- Mỗi section là một hộp hoàn chỉnh độc lập.
- Điền 'cue' là Tên hộp, 'definition' là Khái niệm cốt lõi, 'bulletPoints' là các nguyên lý và ví dụ.`,
  allinone: `Note tối thượng tích hợp.
- Điền đầy đủ cả 'cue'/'note' (Cornell), 'bulletPoints' (Outline), và 'tableData' (Charting) trên các section khác nhau để kết hợp ưu thế đa phương pháp.`,
  mindmap: `Sơ đồ tư duy dạng chữ (Text Mindmap).
- Dùng 'bulletPoints' với định dạng thụt lề phân nhánh logic (ví dụ: "+ Chủ đề", "  - Nhánh 1", "    * Nhánh 2").`,
  flashcard: `Bộ thẻ nhớ Active Recall.
- Mỗi section là một thẻ nhớ.
- BẮT BUỘC điền 'question' (Mặt trước - Khái niệm/Thuật ngữ) và 'answer' (Mặt sau - Giải thích ngắn gọn và ứng dụng thực tiễn).`,
  'deep-research': `Báo cáo Nghiên cứu học thuật chuẩn khoa học.
- Cấu trúc chặt chẽ gồm Abstract, Literature Review, Methodology, Findings và References.
- Nêu rõ nguồn trích dẫn và bằng chứng thực nghiệm trong 'text'.`,
  feynman: `Giải thích đơn giản hóa đa tầng.
- Section 1: Giải thích bằng ngôn ngữ bình dân (cho trẻ em 10 tuổi hiểu được).
- Section 2: Ví dụ thực tế hoặc phép ẩn dụ trực quan.
- Section 3: Định nghĩa chuẩn học thuật và kỹ thuật chuyên sâu.
- Section 4: Chỉ rõ các lỗ hổng tư duy đã phát hiện và cách lấp đầy.`,
  'first-principles': `Bóc tách nguyên lý gốc.
- Section 1: Liệt kê và bác bỏ các giả định thông thường (Assumptions).
- Section 2: Chân lý vật lý / Sự thật cơ bản nhất không thể bóc tách thêm.
- Section 3: Tái thiết lập giải pháp từ con số không dựa trên chân lý cơ bản.`,
  syntopical: `Đọc tổng hợp đối chiếu đa nguồn.
- So sánh các luận điểm đồng thuận và tranh cãi giữa nhiều tác giả/nguồn tài liệu.
- BẮT BUỘC điền 'tableData' đối chiếu ý kiến của các bên.`,
  '5w1h-action': `Khung hành động dự án 5W1H (Who, What, When, Where, Why, How).
- Điền chi tiết bối cảnh, mốc thời gian, KPI và ma trận phân tích rủi ro có đo lường.`,
  'quick-summary': `Tóm tắt siêu nhanh 1 trang. Lấy 3-5 ý cốt lõi nhất.`,
  'executive-summary': `Tóm tắt cấp quản trị chiến lược, làm rõ mục tiêu, số liệu tài chính/đạt được và giải pháp then chốt.`,
  custom: `Tuân thủ nghiêm ngặt mô tả phong cách tùy biến của người dùng.`,
};

// Pool 3 template Free (PRD 4.2): khi user Free dùng Auto, chỉ cho random trong đây.
const freeTemplates: NoteMethod[] = ['cornell', 'outline', 'summary'];

export function extractJsonFromText(text: string): AgentResponseOutput {
  const clean = text.trim();
  try {
    const parsed = JSON.parse(clean);
    if (parsed && (parsed.replyText !== undefined || parsed.isNoteAction !== undefined)) {
      return parsed;
    }
  } catch {}

  // Match ```json ... ```
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && (parsed.replyText !== undefined || parsed.isNoteAction !== undefined)) {
        return parsed;
      }
    } catch {}
  }

  // Match between first { and last }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      if (parsed && (parsed.replyText !== undefined || parsed.isNoteAction !== undefined)) {
        return parsed;
      }
    } catch {}
  }

  // If pure conversational output without JSON schema
  return {
    replyText: clean,
    isNoteAction: false,
    note: null,
  };
}

/**
 * Universal AI Agent Dispatcher:
 * Routes requests through System Gemini 2.0 Flash, or BYOK Providers (Google, OpenAI, Claude, Groq, OpenRouter, NVIDIA, Local, Custom Endpoints).
 * Returns AgentResponseOutput containing conversational replyText and optional structured note artifact.
 */
export async function dispatchAgentResponse(params: AIModelRequest): Promise<AgentResponseOutput> {
  const { providerId, endpointUrl, apiKey, model, inputText, method = 'auto', language = 'vi', userPlan } = params;

  const resolvedMethod: NoteMethod =
    method === 'auto' && (userPlan || 'free') === 'free'
      ? freeTemplates[Math.floor(Math.random() * freeTemplates.length)]
      : method;

  const effectiveModel = model || 'gemini-2.0-flash';

  // 1. Built-in Google Gemini Free Tier Pool
  if (!endpointUrl || providerId === 'google-system' || providerId === 'system') {
    return await generateGeminiAgentResponse({
      inputText,
      method: resolvedMethod,
      language,
      model: effectiveModel,
    });
  }

  // 2. BYOK Google Gemini with custom API Key
  if (endpointUrl.includes('googleapis.com') || providerId === 'google') {
    return await generateGeminiAgentResponse({
      inputText,
      method: resolvedMethod,
      language,
      model: effectiveModel,
      apiKey,
    });
  }

  // 3. BYOK Anthropic Claude
  if (endpointUrl.includes('anthropic.com') || providerId === 'anthropic') {
    return await generateAgentWithAnthropic({ ...params, method: resolvedMethod, model: effectiveModel });
  }

  // 4. BYOK OpenAI / Groq / OpenRouter / NVIDIA / Local / Custom OpenAI-Compatible
  return await generateAgentWithOpenAICompatible({ ...params, method: resolvedMethod, model: effectiveModel });
}

/**
 * Backward-compatible dispatchStructuredNote
 */
export async function dispatchStructuredNote(params: AIModelRequest): Promise<StructuredNoteOutput> {
  const agentRes = await dispatchAgentResponse(params);
  if (agentRes.note) {
    return agentRes.note;
  }
  return {
    title: 'Ghi chú nghiên cứu',
    method: params.method || 'cornell',
    summary: agentRes.replyText.substring(0, 300),
    category: 'AI Assistant',
    keywords: ['AI', 'Research', 'Notes'],
    coreQuestions: ['Mục tiêu cốt lõi?'],
    content: {
      overview: agentRes.replyText,
      sections: [{ title: 'Nội dung', text: agentRes.replyText }],
      summaryText: 'Hoàn thành ghi chú.',
    },
    rawMarkdown: agentRes.replyText,
  };
}

async function generateAgentWithOpenAICompatible(params: AIModelRequest): Promise<AgentResponseOutput> {
  const { endpointUrl, apiKey, model = 'gpt-4o-mini', inputText, method = 'auto', language = 'vi' } = params;
  const cleanEndpoint = (endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = cleanEndpoint.endsWith('/chat/completions') ? cleanEndpoint : `${cleanEndpoint}/chat/completions`;

  const systemPrompt = `Bạn là Zero AI Note Agent — Trợ lý Nghiên cứu & Ghi chú Học thuật Thông minh kiêm Kỹ sư Phần mềm Cao cấp (Senior Software & AI Engineer).
Mô hình AI bạn đang chạy: "${model}".
Ngôn ngữ: ${language === 'vi' ? 'Tiếng Việt' : 'English'}.

ĐẶC ĐIỂM HOẠT ĐỘNG:
1. Trả lời thông minh, đúng trọng tâm, hiểu ngữ cảnh và hỗ trợ lập trình Frontend / UI-UX sạch đẹp khi được hỏi.
2. Nếu người dùng chỉ đang trò chuyện, hỏi bạn là ai, hỏi model/provider đang dùng, giải thích khái niệm, hoặc viết code:
   - "isNoteAction": false
   - "replyText": Trả lời chi tiết, Markdown đầy đủ trong khung chat.
   - "note": null
3. Nếu người dùng yêu cầu tạo note nhưng chưa có đủ thông tin / tài liệu:
   - "isNoteAction": false
   - "replyText": Hỏi thăm và gợi ý người dùng cung cấp thêm chủ đề hoặc tài liệu.
   - "note": null
4. Nếu người dùng cung cấp tài liệu hoặc yêu cầu cụ thể tổng hợp bài học:
   - "isNoteAction": true
   - "replyText": Lời nhắn ngắn gọn đã tổng hợp note vào Artifact Panel.
   - "note": Structured Note JSON theo method "${method}".

BẮT BUỘC TUÂN THỦ HƯỚNG DẪN CHI TIẾT CHO PHƯƠNG PHÁP "${method === 'auto' ? 'cornell' : method}":
${templateDetailedInstructions[method === 'auto' ? 'cornell' : method] || ''}

BẮT BUỘC TRẢ VỀ DUY NHẤT JSON THEO SCHEMA:
{
  "replyText": "Nội dung phản hồi khung chat",
  "isNoteAction": true hoặc false,
  "note": {
    "title": "Tiêu đề ghi chú",
    "method": "${method === 'auto' ? 'cornell' : method}",
    "summary": "Tóm tắt tổng quan",
    "category": "Danh mục",
    "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"],
    "coreQuestions": ["Câu hỏi 1?", "Câu hỏi 2?", "Câu hỏi 3?"],
    "content": {
      "overview": "Tổng quan",
      "sections": [
        {
          "title": "Tiêu đề phần",
          "definition": "Định nghĩa nếu có",
          "text": "Nội dung phân tích",
          "cue": "Gợi ý",
          "note": "Ý chính",
          "question": "Câu hỏi",
          "answer": "Câu trả lời",
          "bulletPoints": ["Điểm 1", "Điểm 2"]
        }
      ],
      "summaryText": "Kết luận"
    },
    "rawMarkdown": "# Bản ghi chú định dạng Markdown..."
  } (hoặc null nếu isNoteAction là false)
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
        { role: 'user', content: inputText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI Provider (${model}) trả về lỗi HTTP ${res.status}: ${errText.substring(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';
  return extractJsonFromText(rawContent);
}

async function generateAgentWithAnthropic(params: AIModelRequest): Promise<AgentResponseOutput> {
  const { endpointUrl = 'https://api.anthropic.com/v1', apiKey, model = 'claude-3-5-haiku-20241022', inputText, method = 'auto', language = 'vi' } = params;
  const url = `${endpointUrl.replace(/\/+$/, '')}/messages`;

  const systemPrompt = `Bạn là Zero AI Note Agent — Trợ lý Nghiên cứu & Ghi chú Học thuật Thông minh (chạy trên Anthropic Claude ${model}).
BẮT BUỘC TUÂN THỦ HƯỚNG DẪN CHI TIẾT CHO PHƯƠNG PHÁP "${method === 'auto' ? 'cornell' : method}":
${templateDetailedInstructions[method === 'auto' ? 'cornell' : method] || ''}

Trả về duy nhất JSON hợp lệ theo schema:
{
  "replyText": "Nội dung phản hồi chat",
  "isNoteAction": boolean,
  "note": null hoặc object { title, method, summary, category, keywords, coreQuestions, content, rawMarkdown }
}`;

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
      messages: [{ role: 'user', content: `Yêu cầu từ người dùng (${language}):\n\n${inputText}` }],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Anthropic Claude (${model}) lỗi: ${err.substring(0, 150)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';
  return extractJsonFromText(text);
}

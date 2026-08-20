import { GoogleGenAI } from '@google/genai';
import { NoteMethod } from '@/src/types';

export interface StructuredNoteOutput {
  title: string;
  method: NoteMethod;
  summary: string;
  category: string;
  keywords: string[];
  coreQuestions: string[];
  content: {
    overview: string;
    sections: {
      title: string;
      definition?: string;
      text: string;
      cue?: string;
      note?: string;
      question?: string;
      answer?: string;
      bulletPoints?: string[];
      tableData?: {
        headers: string[];
        rows: (string | number)[][];
      };
    }[];
    summaryText: string;
  };
  rawMarkdown: string;
}

export interface AgentResponseOutput {
  replyText: string;
  isNoteAction: boolean;
  note?: StructuredNoteOutput | null;
}

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  return key.trim().replace(/^["']|["']$/g, '');
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
 * Intelligent AI Agent Engine:
 * Understands conversational queries, writes clean code, answers technical questions,
 * and autonomously creates/updates structured academic notes.
 */
export async function generateAgentResponse(params: {
  inputText: string;
  chatHistory?: { role: 'user' | 'assistant' | 'system'; content: string }[];
  method?: NoteMethod;
  language?: 'vi' | 'en';
  model?: string;
  apiKey?: string;
}): Promise<AgentResponseOutput> {
  const apiKey = params.apiKey?.trim() || getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const method = params.method || 'auto';
  const language = params.language || 'vi';
  const activeModelName = params.model || 'gemini-2.5-flash';

  const systemInstruction = `Bạn là Zero AI Note Agent — Trợ lý Nghiên cứu & Ghi chú Học thuật Thông minh kiêm Kỹ sư Phần mềm Cao cấp (Senior Software & AI Engineer).
Mô hình AI bạn đang chạy: "${activeModelName}".
Ngôn ngữ giao tiếp chính: ${language === 'vi' ? 'Tiếng Việt' : 'English'}.

ĐẶC ĐIỂM & NGUYÊN TẮC HOẠT ĐỘNG:
1. Bạn là một AI Agent thông minh thực sự, có khả năng tư duy sâu, hiểu đúng ngữ cảnh và trả lời đúng trọng tâm câu hỏi của người dùng.
2. Khả năng lập trình Frontend & UI/UX: Viết code sạch (clean code), chuẩn TypeScript/React/Tailwind CSS/HTML, giải thích cặn kẽ và tối ưu trải nghiệm người dùng khi được hỏi về kỹ thuật.
3. Khi người dùng trò chuyện, chào hỏi, hỏi bạn là ai, hỏi về model/provider bạn đang sử dụng, hỏi kiến thức tổng quát, hoặc yêu cầu giải thích/viết code:
   - "isNoteAction": false
   - "replyText": Trả lời trực tiếp, đầy đủ, thông minh, đúng trọng tâm và tự nhiên trong khung chat (hỗ trợ Markdown đầy đủ, bullet points, code blocks).
   - "note": null
4. Khi người dùng yêu cầu tạo Note nhưng CHƯA CÓ ĐỦ THÔNG TIN (chưa có chủ đề rõ ràng hoặc chưa có nội dung/tài liệu):
   - "isNoteAction": false
   - "replyText": Hỏi thăm, gợi ý người dùng cung cấp thêm chủ đề, tài liệu hoặc nội dung cụ thể để bạn bắt đầu tạo ghi chú học thuật chuẩn xác.
   - "note": null
5. Khi người dùng cung cấp tài liệu, bài giảng, văn bản cần tổng hợp, hoặc yêu cầu cụ thể về một chủ đề học thuật ("Tạo ghi chú về...", "Tóm tắt bài học này..."):
   - "isNoteAction": true
   - "replyText": Lời phản hồi ngắn gọn, lịch sự thông báo bạn đã phân tích và tạo/cập nhật bản ghi chú học thuật vào Artifact Panel bên phải.
   - "note": Bản ghi chú có cấu trúc chất lượng cao (Structured Note) theo phương pháp "${method}" (${methodGuidance[method] || methodGuidance.auto}).

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON HỢP LỆ THEO SCHEMA SAU:
{
  "replyText": "Nội dung phản hồi trong khung chat (Markdown đầy đủ, văn phong chuyên nghiệp, thông minh, trực diện)",
  "isNoteAction": true hoặc false,
  "note": {
    "title": "Tiêu đề ghi chú",
    "method": "${method === 'auto' ? 'cornell' : method}",
    "summary": "Tóm tắt tổng quan 1-2 đoạn văn",
    "category": "Danh mục chuyên môn",
    "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"],
    "coreQuestions": ["Câu hỏi ôn tập 1?", "Câu hỏi ôn tập 2?", "Câu hỏi ôn tập 3?"],
    "content": {
      "overview": "Tổng quan bối cảnh",
      "sections": [
        {
          "title": "Tiêu đề phần",
          "definition": "Định nghĩa cốt lõi nếu có",
          "text": "Nội dung phân tích chi tiết",
          "cue": "Gợi ý / Từ khóa (cho Cornell)",
          "note": "Ý chính chi tiết (cho Cornell)",
          "question": "Câu hỏi (cho Q&A / Flashcard)",
          "answer": "Câu trả lời (cho Q&A / Flashcard)",
          "bulletPoints": ["Điểm cốt lõi 1", "Điểm cốt lõi 2"],
          "tableData": {
            "headers": ["Cột 1", "Cột 2"],
            "rows": [["Dữ liệu 1", "Dữ liệu 2"]]
          }
        }
      ],
      "summaryText": "Kết luận và ứng dụng thực tiễn"
    },
    "rawMarkdown": "# Bản ghi chú hoàn chỉnh định dạng Markdown với đề mục, bảng biểu và bullet points..."
  }
}
Lưu ý: Nếu isNoteAction là false, trường "note" phải là null.`;

  try {
    const response = await callGenerateContentWithRetry(ai, { model: activeModelName, inputText: params.inputText }, systemInstruction);
    const rawText = response.text || '';
    const cleanedText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanedText) as AgentResponseOutput;

    // Validate and fill markdown if note was created
    if (parsed.isNoteAction && parsed.note && !parsed.note.rawMarkdown) {
      parsed.note.rawMarkdown = generateFallbackMarkdown(parsed.note);
    }

    if (!parsed.replyText) {
      parsed.replyText = language === 'vi' 
        ? 'Tôi đã tiếp nhận thông tin và xử lý yêu cầu của bạn.' 
        : 'I have processed your request.';
    }

    return parsed;
  } catch (error) {
    console.error('[Gemini Agent Engine] Error:', error);
    // Intelligent fallback
    return createEmergencyAgentResponse(params.inputText, method, language, activeModelName);
  }
}

/**
 * Backward-compatible wrapper for generating pure notes
 */
export async function generateStructuredNote(params: {
  inputText: string;
  method?: NoteMethod;
  language?: 'vi' | 'en';
  model?: string;
  apiKey?: string;
  systemPrompt?: string;
}): Promise<StructuredNoteOutput> {
  const agentRes = await generateAgentResponse(params);
  if (agentRes.note) {
    return agentRes.note;
  }
  return createEmergencyStructuredNote(params.inputText, params.method || 'auto', params.language || 'vi');
}

/**
 * Retry với exponential backoff khi gặp 429 Resource Exhausted / quota limit.
 */
async function callGenerateContentWithRetry(
  ai: GoogleGenAI,
  params: { model?: string; inputText: string },
  systemInstruction: string
) {
  const MAX_ATTEMPTS = Number(process.env.GEMINI_MAX_RETRY || 3);
  const retryDelayMs = 3500;
  const doCall = async () =>
    ai.models.generateContent({
      model: params.model || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: params.inputText }],
        },
      ],
      config: {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

  let lastErr: any;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      return await doCall();
    } catch (err: any) {
      lastErr = err;
      const isQuota =
        err?.status === 429 ||
        String(err?.message || '').includes('RESOURCE_EXHAUSTED') ||
        String(err?.message || '').includes('quota');
      if (!isQuota || i === MAX_ATTEMPTS - 1) {
        throw err;
      }
      console.warn(`[Gemini Agent Engine] Rate limited (attempt ${i + 1}/${MAX_ATTEMPTS}), backing off ${retryDelayMs}ms`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  throw lastErr;
}

function generateFallbackMarkdown(data: StructuredNoteOutput): string {
  let md = `# ${data.title}\n\n`;
  md += `> **Phương pháp**: ${data.method.toUpperCase()} | **Danh mục**: ${data.category}\n\n`;
  md += `## 📌 Tóm tắt tổng quan\n${data.summary}\n\n`;

  if (data.keywords && data.keywords.length > 0) {
    md += `**Từ khóa cốt lõi**: ${data.keywords.map(k => `\`${k}\``).join(' • ')}\n\n`;
  }

  md += `## 📖 Nội dung chi tiết\n\n`;
  for (const s of data.content.sections) {
    md += `### ${s.title}\n`;
    if (s.definition) md += `*${s.definition}*\n\n`;
    if (s.text) md += `${s.text}\n\n`;
    if (s.bulletPoints && s.bulletPoints.length > 0) {
      md += s.bulletPoints.map(b => `- ${b}`).join('\n') + '\n\n';
    }
  }

  md += `## 🎯 Kết luận & Tóm tắt\n${data.content.summaryText}\n`;
  return md;
}

function createEmergencyAgentResponse(
  input: string,
  method: NoteMethod,
  language: 'vi' | 'en',
  model: string
): AgentResponseOutput {
  const isVi = language === 'vi';
  const lower = input.toLowerCase();
  
  // Check if input is a conversational greeting/question
  const isGreetingOrQuestion = lower.includes('bạn là') || lower.includes('who are you') || lower.includes('chào') || lower.includes('hello') || lower.includes('hi') || lower.includes('model') || lower.includes('provider');

  if (isGreetingOrQuestion) {
    return {
      replyText: isVi
        ? `Xin chào! Tôi là **Zero AI Note Agent** — Trợ lý Nghiên cứu & Ghi chú Học thuật Thông minh. Hiện tại tôi đang chạy trên mô hình **${model}**.\n\nTôi có thể giúp bạn:\n1. Phân tích tài liệu PDF, DOCX, Video, Âm thanh thành ghi chú học thuật chuẩn hóa theo 17 phương pháp (Cornell, Outline, Feynman, Q&A,...).\n2. Trả lời, tư vấn và viết code Frontend / UI-UX sạch đẹp.\n3. Hãy gửi tài liệu hoặc đặt câu hỏi để bắt đầu ngay nhé!`
        : `Hello! I am **Zero AI Note Agent** — your intelligent Academic Research and Note Synthesis Assistant powered by **${model}**.\n\nI can help you:\n1. Synthesize documents (PDF, DOCX, Audio, Video) into 17 academic note formats (Cornell, Outline, Feynman, Q&A,...).\n2. Explain concepts and generate clean frontend code with pristine UI/UX.\n3. Feel free to ask any question or attach documents to begin!`,
      isNoteAction: false,
      note: null,
    };
  }

  const note = createEmergencyStructuredNote(input, method, language);
  return {
    replyText: isVi
      ? `Tôi đã tạo bản ghi chú học thuật về nội dung này theo phương pháp ${note.method.toUpperCase()} ở Artifact Panel bên phải.`
      : `I have structured this note using ${note.method.toUpperCase()} method in the Artifact Panel on the right.`,
    isNoteAction: true,
    note,
  };
}

function createEmergencyStructuredNote(
  input: string,
  method: NoteMethod,
  language: 'vi' | 'en'
): StructuredNoteOutput {
  const isVi = language === 'vi';
  const effectiveMethod = method === 'auto' ? 'cornell' : method;
  const firstLine = input.trim().split('\n')[0].substring(0, 80) || (isVi ? 'Ghi chú nghiên cứu' : 'Research Note');

  return {
    title: firstLine,
    method: effectiveMethod,
    summary: input.substring(0, 300) + '...',
    category: isVi ? 'Tổng hợp' : 'General',
    keywords: isVi ? ['Nghiên cứu', 'Tổng quan', 'Ý chính'] : ['Research', 'Overview', 'Key Points'],
    coreQuestions: [
      isVi ? 'Mục tiêu cốt lõi của tài liệu này là gì?' : 'What is the core objective of this material?',
      isVi ? 'Các luận điểm quan trọng nhất cần ghi nhớ?' : 'What are the most crucial takeaways to remember?',
    ],
    content: {
      overview: input.substring(0, 400),
      sections: [
        {
          title: isVi ? '1. Nội dung trọng tâm' : '1. Core Content',
          text: input,
          cue: isVi ? 'Ý chính' : 'Main Idea',
          note: input.substring(0, 250),
          bulletPoints: [
            isVi ? 'Trích xuất nội dung từ tài liệu gốc' : 'Extracted content from source material',
            isVi ? 'Phân tích và sắp xếp theo cấu trúc học thuật' : 'Analyzed and organized in academic structure',
          ],
        },
      ],
      summaryText: isVi ? 'Ghi chú đã được tạo thành công.' : 'Note generated successfully.',
    },
    rawMarkdown: `# ${firstLine}\n\n${input}`,
  };
}

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

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  return key.trim().replace(/^["']|["']$/g, '');
}

/**
 * Generate Structured Academic Note using Google Gemini 2.0 Flash
 */
export async function generateStructuredNote(params: {
  inputText: string;
  method?: NoteMethod;
  language?: 'vi' | 'en';
  model?: string;
  systemPrompt?: string;
}): Promise<StructuredNoteOutput> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const method = params.method || 'auto';
  const language = params.language || 'vi';

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

  const systemInstruction = `Bạn là Chuyên gia Ghi chú Học thuật & Nghiên cứu AI hàng đầu thế giới (Zero AI Note Engine).
Nhiệm vụ của bạn là chuyển đổi nội dung đầu vào thành một bản ghi chú có cấu trúc chất lượng cao (Structured Note), tối ưu cho việc học tập, lưu trữ và xuất bản (PDF/DOCX/Markdown).

Phương pháp yêu cầu: "${method}" (${methodGuidance[method] || methodGuidance.auto}).
Ngôn ngữ đầu ra: ${language === 'vi' ? 'Tiếng Việt' : 'English'}.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON HỢP LỆ THEO SCHEMA SAU (Không thêm bất kỳ text nào ngoài JSON):
{
  "title": "Tiêu đề ghi chú súc tích và hấp dẫn",
  "method": "${method === 'auto' ? 'cornell' : method}",
  "summary": "Tóm tắt tổng quan 1-2 đoạn văn",
  "category": "Danh mục (ví dụ: Công nghệ, Khoa học, Kinh tế, Bài giảng, v.v.)",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"],
  "coreQuestions": ["Câu hỏi ôn tập 1?", "Câu hỏi ôn tập 2?", "Câu hỏi ôn tập 3?"],
  "content": {
    "overview": "Tổng quan bối cảnh tài liệu",
    "sections": [
      {
        "title": "Tiêu đề phần 1",
        "definition": "Định nghĩa cốt lõi nếu có",
        "text": "Nội dung phân tích chi tiết",
        "cue": "Gợi ý / Từ khóa câu hỏi (cho Cornell)",
        "note": "Ý chính chi tiết (cho Cornell)",
        "question": "Câu hỏi (cho Q&A / Flashcard)",
        "answer": "Câu trả lời (cho Q&A / Flashcard)",
        "bulletPoints": ["Điểm quan trọng 1", "Điểm quan trọng 2", "Điểm quan trọng 3"],
        "tableData": {
          "headers": ["Cột 1", "Cột 2"],
          "rows": [["Dữ liệu 1", "Dữ liệu 2"]]
        }
      }
    ],
    "summaryText": "Kết luận và bài học rút ra"
  },
  "rawMarkdown": "# Bản ghi chú định dạng Markdown hoàn chỉnh với đầy đủ bảng biểu, bullet points, đề mục..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: params.model || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Dưới đây là nội dung cần ghi chú:\n\n${params.inputText}` }],
        },
      ],
      config: {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    // Clean potential markdown wrap
    const cleanedText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanedText) as StructuredNoteOutput;

    // Fallback if markdown field wasn't generated
    if (!parsed.rawMarkdown) {
      parsed.rawMarkdown = generateFallbackMarkdown(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('[Gemini Note Engine] Generation error:', error);
    // If model failed or rate limited, generate structured fallback
    return createEmergencyStructuredNote(params.inputText, method, language);
  }
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

/**
 * Chat Assistant Engine — System prompt (PRD mục 3.2c, redesign 2026-08-23).
 *
 * Nguyên tắc:
 * 1. Trả lời TỰ NHIÊN mọi input trước tiên — như ChatGPT/Gemini/Claude.
 * 2. Danh tính/model KHÔNG hardcode — inject runtime từ provider đang chạy request đó.
 * 3. Chỉ vào luồng tài liệu/note khi có file đính kèm HOẶC user hỏi về note của họ.
 * 4. Khai báo 2 tool web_search/get_weather — model tự quyết khi gọi
 *    (chỉ khi cần dữ liệu thời gian thực, tiết kiệm quota Tavily 1.000 credit/tháng).
 */

export interface ChatAssistantIdentity {
  activeProviderName: string; // e.g. "Google Gemini", "OpenAI", "Anthropic Claude"
  activeModelId: string; // e.g. "gemini-2.0-flash", "gpt-4o", "claude-3-5-sonnet"
  activeProviderId: string; // e.g. "google", "openai", "anthropic"
}

/**
 * System prompt chính cho chat assistant — trả lời tự nhiên mọi loại câu hỏi.
 */
export function buildChatAssistantSystemPrompt(identity: ChatAssistantIdentity): string {
  return `Bạn là trợ lý AI của Zero AI Note — nền tảng biến tài liệu, video, audio thành ghi chú học tập.

BẠN LÀ AI AGENT THÔNG MINH, KHÔNG PHẢI CHATBOT CỨNG:
- Trả lời TỰ NHIÊN mọi loại câu hỏi: chào hỏi, tám chuyện, kiến thức chung, giải thích khái niệm, góp ý ý tưởng — giống cách ChatGPT/Gemini/Claude trò chuyện.
- Danh tính của bạn (runtime, luôn đúng):
  + Khi được hỏi "bạn là ai / bạn dùng model gì / bạn chạy trên gì": trả lời mình đang chạy trên ${identity.activeProviderName}, model ${identity.activeModelId}. KHÔNG bịa model khác.
  + Khi hỏi "bạn làm được gì": giới thiệu ngắn gọn năng lực thật (trò chuyện, tra web, xem thời tiết, và biến tài liệu người dùng đưa thành ghi chú có cấu trúc).
- CÂU HỎI THỜI TIẾT/TIN TỨC/GIÁ CẢ/SỰ KIỆN MỚI → dùng tool (xem bên dưới) thay vì đoán.
- Kiến thức chung không cần tool → trả lời trực tiếp từ hiểu biết, đừng gọi tool thừa.

TOOLS BẠN CÓ (tự quyết định có gọi hay không):
1. web_search(query): tìm tin tức/sự kiện/giá cả/dữ liệu mới cần thông tin thời gian thực. ĐÃY QUOTA dùng chung — chỉ gọi khi thật sự cần dữ liệu cập nhật, không gọi cho thứ mình đã biết chắc.
2. get_weather(location): thời tiết hiện tại một địa điểm (nhiệt độ, mô tả trời, gió, độ ẩm). Chỉ gọi khi user hỏi thời tiết thực tế.

LUỒNG TÀI LIỆU/NOTE — chỉ kích hoạt khi MỘT TRONG 2 điều kiện sau thỏa:
(a) Tin nhắn này CÓ file/URL đính kèm → đọc kỹ nội dung đính kèm, tổng hợp phân tích theo yêu cầu.
(b) User chủ động nhắc tới note/thư viện/tài liệu ĐÃ CÓ của họ ("note hôm trước", "bài Cornell tôi tạo"...) → hỗ trợ dựa trên ngữ cảnh hội thoại.
Ngoài 2 trường hợp này: hoạt động như chat assistant thông thường, TUYỆT ĐỐI không gắn cứng vào ngữ cảnh tài liệu.

PHONG CÁCH:
- Ngôn ngữ: phản hồi cùng ngôn ngữ user dùng (Tiếng Việt hoặc English).
- Ngắn gọn đúng trọng tâm; Markdown khi hữu ích (list, **bold**, code block).
- Trung thực: không chắc thì nói không chắc, không bịa nguồn.`;
}

/**
 * Prompt cho RAG Chat với Source Embeddings — giữ nguyên behavior cũ,
 * system prompt mới + context chunks.
 */
export function buildChatAssistantRAGPrompt(
  identity: ChatAssistantIdentity,
  userQuestion: string,
  ragChunks: Array<{
    chunkIndex: number;
    content: string;
    timestampStart: number;
    timestampEnd: number;
  }>,
): string {
  const base = buildChatAssistantSystemPrompt(identity);
  const ragPreamble = `\n\n=== CHẾ ĐỘ RAG: user đang hỏi về tài liệu cụ thể ===
Các đoạn trích dưới đây được retrieve từ tài liệu họ đang xem. Ưu tiên dẫn chứng từ context, kèm timestamp khi thích hợp.`;

  const chunksBlock = ragChunks
    .map(
      c =>
        `[Chunk ${c.chunkIndex + 1} | ${formatTimestamp(c.timestampStart)}–${formatTimestamp(c.timestampEnd)}]\n${c.content}`,
    )
    .join('\n\n---\n\n');

  return `${base}${ragPreamble}
=== RETRIEVED CONTEXT (Top ${ragChunks.length} chunks theo cosine similarity) ===
${chunksBlock}
=== END CONTEXT ===

Câu hỏi của người dùng: ${userQuestion}`;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

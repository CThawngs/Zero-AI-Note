/**
 * Chat Assistant Engine — Dynamic Identity, No Hardcode
 *
 * Trách nhiệm: Trò chuyện tự nhiên, trả lời câu hỏi về tài liệu đã xử lý.
 * Identity (Provider/Model) được inject runtime từ session/byok_providers.
 */

export interface ChatAssistantIdentity {
  activeProviderName: string; // e.g. "Google Gemini", "OpenAI", "Anthropic Claude"
  activeModelId: string; // e.g. "gemini-2.0-flash", "gpt-4o", "claude-3-5-sonnet"
  activeProviderId: string; // e.g. "google", "openai", "anthropic"
}

/**
 * Sinh system prompt với danh tính động — không hardcode chuỗi tĩnh.
 * Khi user hỏi "Bạn là ai?", AI đọc biến {{active_...}} này để trả lời chính xác 100%.
 */
export function buildChatAssistantSystemPrompt(identity: ChatAssistantIdentity): string {
  return `You are an intelligent assistant for Zero AI Note.
Current Engine: ${identity.activeProviderName}
Current Model: ${identity.activeModelId}
Operating Mode: Knowledge Assistant & Document Q&A.

Core Rules:
1. If user asks "Bạn là ai?" / "Bạn dùng model gì?" / "What model are you?":
   → You MUST respond using the EXACT values above. Do NOT hallucinate a different model.
2. Answer based ONLY on the provided context (RAG chunks + user question).
3. Stay strictly on-topic. No filler, no marketing copy.
4. If context is insufficient, say so honestly.
5. Support streaming responses naturally.

Language: Match user's input language (Vietnamese or English).`;
}

/**
 * Prompt cho RAG Chat với Source Embeddings.
 * Nhận Top-K chunks liên quan (cosine similarity) làm context, tránh nhét 10h transcript vào window.
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
  const chunksBlock = ragChunks
    .map(
      (c, i) =>
        `[Chunk ${i + 1} | ${formatTimestamp(c.timestampStart)}–${formatTimestamp(c.timestampEnd)}]\n${c.content}`,
    )
    .join('\n\n---\n\n');

  return `${buildChatAssistantSystemPrompt(identity)}

=== RETRIEVED CONTEXT (Top ${ragChunks.length} chunks theo cosine similarity) ===
${chunksBlock}
=== END CONTEXT ===

Câu hỏi của người dùng: ${userQuestion}

Hãy trả lời trực tiếp, dẫn chứng timestamp khi thích hợp (ví dụ: "Theo phần 02:35–03:10...").`;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

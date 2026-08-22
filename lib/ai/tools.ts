import { GoogleGenAI } from '@google/genai';

/**
 * Agent tools — "có tay có chân" (PRD mục 3.2c Autonomous Gathering).
 * Không hardcode câu trả lời: model TỰ QUYẾT gọi tool qua Google Search
 * grounding; kết quả feed lại model để sinh câu trả lời cuối.
 *
 * Tools:
 * 1. google_search grounding — thời tiết/tin tức/sự kiện: dữ liệu thật, không hallucinate.
 *    ponytail: dùng built-in Google Search thay vì MCP client riêng — cùng cơ chế
 *    tool-use; upgrade path: thêm MCP stdio servers khi cần private tools.
 * 2. read_web_page — đọc bài viết cụ thể user gửi trong câu hỏi.
 */

export interface ToolCallRecord {
  tool: string;
  input: string;
  summary: string;
}

const SEARCH_TOOL = { googleSearch: {} } as const;

async function readWebPage(url: string): Promise<ToolCallRecord> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: AbortSignal.timeout(25000),
      headers: { 'X-Return-Format': 'text' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return { tool: 'read_web_page', input: url, summary: text.slice(0, 12000) };
  } catch (e) {
    return {
      tool: 'read_web_page',
      input: url,
      summary: `[Không đọc được ${url}: ${e instanceof Error ? e.message : String(e)}]`,
    };
  }
}

/** Extract URL đầu tiên trong text (nếu có). */
function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)"']+/);
  return m ? m[0] : null;
}

/**
 * Agent loop: gọi Gemini với google_search grounding + pre-fetch URL
 * xuất hiện trong câu hỏi. Model tự quyết định dùng dữ liệu search hay không.
 */
export async function runAgentWithTools(params: {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userContent: string;
  language: 'vi' | 'en';
}): Promise<{ replyText: string; toolsUsed: ToolCallRecord[]; usedFallbackModel: boolean }> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  const models = [params.model || 'gemini-flash-latest', 'gemini-2.0-flash'];
  const toolsUsed: ToolCallRecord[] = [];

  // Pass 0: nếu user dán link trong câu hỏi → đọc trang trước, nhét vào context
  const url = firstUrl(params.userContent);
  if (url) {
    toolsUsed.push(await readWebPage(url));
  }

  let lastErr: unknown;
  for (let m = 0; m < models.length; m++) {
    try {
      const res = await ai.models.generateContent({
        model: models[m],
        contents: [
          {
            role: 'user',
            parts: [
              ...(toolsUsed.length
                ? [{
                    text: `=== KẾT QUẢ TOOL CALLS ===\n${toolsUsed
                      .map(t => `[${t.tool}] ${t.input}\n${t.summary}`)
                      .join('\n\n')}\n=== HẾT TOOL RESULTS ===`,
                  }]
                : []),
              { text: params.userContent },
            ],
          },
        ],
        config: {
          systemInstruction: { parts: [{ text: params.systemPrompt }] },
          tools: [SEARCH_TOOL],
          temperature: 0.4,
        },
      });
      return {
        replyText: res.text || '',
        toolsUsed,
        usedFallbackModel: m > 0,
      };
    } catch (e) {
      lastErr = e;
      console.warn(`[agent-tools] model ${models[m]} failed:`, e instanceof Error ? e.message : e);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Agent tools failed on all models');
}

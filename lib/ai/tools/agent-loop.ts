/**
 * Agent loop chuẩn function-calling — chạy đồng nhất mọi provider (PRD 3.2c).
 *
 * Flow: system prompt + user msg + tools → model → nếu trả tool_call:
 * execute thật → gửi kết quả lại → lặp tối đa MAX_ROUNDS → text cuối cùng.
 *
 * Backends hỗ trợ:
 * - gemini:    @google/genai SDK, tools = functionDeclarations
 * - openai:    POST /chat/completions với `tools` (OpenAI/Groq/OpenRouter/NVIDIA/Local)
 * - anthropic: POST /v1/messages với `tools`
 */

import { GoogleGenAI } from '@google/genai';
import {
  chatAssistantTools,
  toGeminiToolConfig,
  toOpenAITools,
  toAnthropicTools,
} from './registry';

const MAX_ROUNDS = 3;

export interface AgentLoopParams {
  backend: 'gemini' | 'openai' | 'anthropic';
  apiKey?: string;
  endpointUrl?: string; // openai-compatible
  model: string;
  systemPrompt: string;
  userMessage: string;
  /** Gate trước khi execute tool. Trả false → tool KHÔNG chạy,
   *  model nhận {error} thay vì kết quả (dùng cho quota guard Tavily). */
  onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<boolean>;
}

export interface AgentLoopResult {
  text: string;
  roundsUsed: number;
  toolsCalled: Array<{ name: string; args: Record<string, unknown> }>;
}

function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const tool = chatAssistantTools.find(t => t.name === name);
  if (!tool) return Promise.resolve({ error: `Unknown tool: ${name}` });
  return tool.execute(args).catch(e => ({ error: e instanceof Error ? e.message : String(e) }));
}

/** Ghi 1 credit Tavily vào bảng usage sau mỗi lần search THÀNH CÔNG (guard đếm row này). */
async function recordTavilyUsage(): Promise<void> {
  try {
    const { getSql } = await import('@/lib/db');
    const sql = getSql();
    await sql`
      insert into usage (user_id, provider, model, operation, input_tokens, output_tokens)
      values (null, 'tavily', 'tavily-basic-search', 'tavily_search', 1, 0)
    `;
  } catch (e) {
    console.warn('[agent-loop] recordTavilyUsage failed (không chặn tool):', e);
  }
}

async function callOpenAI(p: AgentLoopParams, history: unknown[]): Promise<unknown> {
  const cleanEndpoint = (p.endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = cleanEndpoint.endsWith('/chat/completions') ? cleanEndpoint : `${cleanEndpoint}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (p.apiKey) headers.Authorization = `Bearer ${p.apiKey}`;
  if (cleanEndpoint.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://zero-ai-note.vercel.app';
    headers['X-Title'] = 'Zero AI Note';
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: p.model,
      messages: [{ role: 'system', content: p.systemPrompt }, ...history],
      tools: toOpenAITools(),
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenAI-compat HTTP ${res.status}: ${(await res.text().catch(() => '')).substring(0, 150)}`);
  return res.json();
}

async function callAnthropic(p: AgentLoopParams, history: unknown[]): Promise<unknown> {
  const base = (p.endpointUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
  const res = await fetch(`${base}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': p.apiKey || '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: p.model,
      system: p.systemPrompt,
      max_tokens: 4000,
      tools: toAnthropicTools(),
      messages: history,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text().catch(() => '')).substring(0, 150)}`);
  return res.json();
}

/**
 * Vòng lặp chính. Trả về text cuối cùng của model.
 */
export async function runChatAgentLoop(p: AgentLoopParams): Promise<AgentLoopResult> {
  const history: unknown[] = [{ role: 'user', content: p.userMessage }];
  const toolsCalled: AgentLoopResult['toolsCalled'] = [];
  let rounds = 0;

  // ── GEMINI native path (@google/genai SDK)
  if (p.backend === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: p.apiKey || '' });
    const contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }> = [
      { role: 'user', parts: [{ text: p.userMessage }] },
    ];

    while (rounds < MAX_ROUNDS) {
      rounds++;
      const res = await ai.models.generateContent({
        model: p.model,
        contents,
        config: {
          systemInstruction: p.systemPrompt,
          tools: [toGeminiToolConfig()],
        },
      });

      // SDK v2+: functionCalls nằm ở top-level candidate
      const fcalls = res.functionCalls || [];
      if (!fcalls.length) {
        return {
          text: res.text || '',
          roundsUsed: rounds,
          toolsCalled,
        };
      }

      // Ghi lại model turn với functionCall parts
      contents.push({
        role: 'model',
        parts: fcalls.map(f => ({ functionCall: { name: f.name!, args: (f.args || {}) as Record<string, unknown> } })),
      });
      for (const f of fcalls) {
        const args = (f.args || {}) as Record<string, unknown>;
        toolsCalled.push({ name: f.name!, args });
        let gateOk = true;
        if (f.name === 'web_search' && p.onToolCall) gateOk = await p.onToolCall('web_search', args);
        const result = gateOk ? await executeTool(f.name!, args) : { error: 'Hết quota tra cứu web tháng này. Hãy trả lời từ kiến thức sẵn có và nói với người dùng rằng không thể tra cứu web lúc này.' };
        if (gateOk && f.name === 'web_search' && !('error' in (result as object))) await recordTavilyUsage();
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name: f.name!, response: result as Record<string, unknown> } }],
        });
      }
    }
    // Hết rounds mà vẫn muốn gọi tool → buộc trả lời text
    const finalRes = await ai.models.generateContent({
      model: p.model,
      contents: [...contents, { role: 'user', parts: [{ text: '(Hết lượt gọi công cụ. Hãy trả lời trực tiếp bằng kiến thức bạn có.)' }] }],
      config: { systemInstruction: p.systemPrompt },
    });
    return { text: finalRes.text || '', roundsUsed: rounds, toolsCalled };
  }

  // ── OPENAI-COMPATIBLE / ANTHROPIC paths
  let lastText = '';
  while (rounds < MAX_ROUNDS) {
    rounds++;
    const data =
      p.backend === 'openai' ? await callOpenAI(p, history) : await callAnthropic(p, history);

    if (p.backend === 'openai') {
      const d = data as {
        choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } }>;
      };
      const msg = d.choices?.[0]?.message;
      const calls = msg?.tool_calls || [];
      if (!calls.length) {
        lastText = msg?.content || '';
        break;
      }
      history.push({ role: 'assistant', content: msg?.content || null, tool_calls: calls });
      for (const c of calls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(c.function.arguments || '{}'); } catch {}
        toolsCalled.push({ name: c.function.name, args });
        let gateOk = true;
        if (c.function.name === 'web_search' && p.onToolCall) gateOk = await p.onToolCall('web_search', args);
        const result = gateOk ? await executeTool(c.function.name, args) : { error: 'Hết quota tra cứu web tháng này — hãy trả lời từ kiến thức sẵn có.' };
        if (gateOk && c.function.name === 'web_search' && !('error' in (result as object))) await recordTavilyUsage();
        history.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result).substring(0, 8000) });
      }
    } else {
      // Anthropic: content blocks
      const d = data as {
        content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
        stop_reason?: string;
      };
      const blocks = d.content || [];
      const toolUseBlocks = blocks.filter(b => b.type === 'tool_use');
      const textParts = blocks.filter(b => b.type === 'text').map(b => b.text || '').join('');
      if (!toolUseBlocks.length) {
        lastText = textParts;
        break;
      }
      history.push({ role: 'assistant', content: blocks });
      for (const tu of toolUseBlocks) {
        const name = tu.name!;
        const args = tu.input || {};
        toolsCalled.push({ name, args });
        let gateOk = true;
        if (name === 'web_search' && p.onToolCall) gateOk = await p.onToolCall('web_search', args);
        const result = gateOk ? await executeTool(name, args) : { error: 'Hết quota tra cứu web tháng này — hãy trả lời từ kiến thức sẵn có.' };
        if (gateOk && name === 'web_search' && !('error' in (result as object))) await recordTavilyUsage();
        history.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result).substring(0, 8000) }],
        });
      }
    }
  }

  return { text: lastText, roundsUsed: rounds, toolsCalled };
}

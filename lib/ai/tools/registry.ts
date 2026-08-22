import { getSql } from '@/lib/db';

/**
 * Tool registry — chuẩn function-calling cho Chat Assistant Engine (PRD 3.2c).
 *
 * Mỗi tool khai báo schema song song 3 format:
 * - gemini: { name, description, parameters }
 * - openai: { type:'function', function:{...} }   (OpenAI/Groq/OpenRouter/NVIDIA/Local)
 * - anthropic: { name, description, input_schema }
 *
 * Agent loop (lib/ai/tools/agent-loop.ts) map đúng format theo provider,
 * execute bằng executor JS thuần → kết quả trả lại model vòng sau.
 */

export interface ToolDef {
  name: string;
  description: string;
  /** JSON Schema tham số */
  parameters: Record<string, unknown>;
  /** Thực thi thật. Trả object JSON-serializable. */
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// ─────────────────────────────────────────────────────────────
// get_weather — Open-Meteo (free, không key; license non-commercial — xem DECISIONS.md)
// ─────────────────────────────────────────────────────────────

/** WMO weather code → mô tả tiếng Việt dễ hiểu. */
export function wmoToVietnamese(code: number): string {
  const map: Record<number, string> = {
    0: 'Trời quang đãng',
    1: 'Chủ yếu quang đãng',
    2: 'Có mây rải rác',
    3: 'Nhiều mây',
    45: 'Sương mù',
    48: 'Sương mù đọng băng',
    51: 'Mưa phùn nhẹ',
    53: 'Mưa phùn',
    55: 'Mưa phùn dày',
    61: 'Mưa nhỏ',
    63: 'Mưa vừa',
    65: 'Mưa to',
    66: 'Mưa đóng băng nhẹ',
    67: 'Mưa đóng băng',
    71: 'Tuyết nhẹ',
    73: 'Tuyết vừa',
    75: 'Tuyết dày',
    77: 'Hạt tuyết',
    80: 'Mưa rào nhẹ',
    81: 'Mưa rào',
    82: 'Mưa rào dữ dội',
    85: 'Mưa tuyết nhẹ',
    86: 'Mưa tuyết',
    95: 'Dông',
    96: 'Dông kèm mưa đá nhẹ',
    99: 'Dông kèm mưa đá mạnh',
  };
  return map[code] || 'Thời tiết không xác định';
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
}

async function geocode(location: string): Promise<GeocodeResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=vi&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) return null;
  return { latitude: r.latitude, longitude: r.longitude, name: r.name as string, country: r.country };
}

export async function getWeather(args: { location: string }): Promise<{
  location: string;
  temperature_c: number;
  weather_description: string;
  wind_kmh: number;
  humidity_percent: number;
} | { error: string }> {
  try {
    const geo = await geocode(args.location);
    if (!geo) return { error: `Không tìm thấy địa điểm "${args.location}"` };

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { error: `Open-Meteo forecast HTTP ${res.status}` };
    const data = await res.json();
    const c = data.current;
    if (!c) return { error: 'Open-Meteo trả về thiếu current' };

    return {
      location: `${geo.name}${geo.country ? ', ' + geo.country : ''}`,
      temperature_c: c.temperature_2m,
      weather_description: wmoToVietnamese(c.weather_code),
      wind_kmh: c.wind_speed_10m,
      humidity_percent: c.relative_humidity_2m,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ─────────────────────────────────────────────────────────────
// web_search — Tavily (free 1.000 credit/tháng dùng chung)
// ─────────────────────────────────────────────────────────────

/** Guard quota tháng: đếm row usage operation='tavily_search'. */
export async function checkTavilyQuota(userId: string): Promise<{ ok: boolean; usedThisMonth: number }> {
  const sql = getSql();
  const rows = (await sql`
    select count(*)::int as n from usage
    where provider = 'tavily' and operation = 'tavily_search'
      and "timestamp" >= date_trunc('month', now())
  `) as unknown as { n: number }[];
  void userId;
  return { ok: rows[0].n < 950, usedThisMonth: rows[0].n }; // buffer 50 trước limit 1000
}

export async function webSearch(args: { query: string }): Promise<
  { results: Array<{ title: string; url: string; snippet: string }> } | { error: string }
> {
  const key = process.env.TAVILY_API_KEY || '';
  if (!key) return { error: 'Chưa cấu hình TAVILY_API_KEY trên server' };

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: args.query, max_results: 5, search_depth: 'basic' }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { error: `Tavily HTTP ${res.status}` };
    const data = await res.json();
    const results = (data.results || []).map((r: { title?: string; url?: string; content?: string }) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: (r.content || '').substring(0, 300),
    }));
    return { results };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ─────────────────────────────────────────────────────────────
// Registry export + format mappers
// ─────────────────────────────────────────────────────────────

export const chatAssistantTools: ToolDef[] = [
  {
    name: 'web_search',
    description:
      'Tìm kiếm thông tin thời gian thực trên web: tin tức mới, sự kiện, giá cả, kết quả thể thao, dữ liệu sau knowledge cutoff. KHÔNG dùng cho kiến thức chung đã biết chắc.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Cụm từ tìm kiếm, ngắn gọn rõ ràng' },
      },
      required: ['query'],
    },
    execute: async args => webSearch({ query: String(args.query || '') }),
  },
  {
    name: 'get_weather',
    description:
      'Lấy thời tiết hiện tại của một địa điểm: nhiệt độ, mô tả trời, gió, độ ẩm. Chỉ gọi khi user hỏi thời tiết thực tế.',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Tên địa điểm, ví dụ "Hà Nội", "Da Nang"' },
      },
      required: ['location'],
    },
    execute: async args => getWeather({ location: String(args.location || '') }),
  },
];

export function toGeminiTools() {
  return chatAssistantTools.map(t => ({
    function_declarations: [
      {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    ],
  }));
}

// Gemini muốn MỘT mảng function_declarations duy nhất
export function toGeminiToolConfig() {
  return {
    functionDeclarations: chatAssistantTools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  };
}

export function toOpenAITools() {
  return chatAssistantTools.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export function toAnthropicTools() {
  return chatAssistantTools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}

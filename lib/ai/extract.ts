import { GoogleGenAI } from '@google/genai';
import { getSql } from '@/lib/db';

/**
 * File content extraction (PRD mục 3.2b bước 4) — CỐT LÕI website.
 *
 * Nguyên tắc (DECISIONS.md §24):
 * - PDF/Image/Audio/Video: Gemini native multimodal đọc trực tiếp file bytes
 *   (system pool key dùng chung, mọi user bất kể BYOK chat/note-gen).
 * - YouTube: Gemini native YouTube URL support (fileData) — không tự scrape.
 * - Web URL: r.jina.ai reader (free, không key).
 * - DOCX: mammoth extract text thuần.
 * - Text/code/md: client đã gửi sẵn content — passthrough.
 *
 * Kết quả transcript được LƯU vào sources.transcript để:
 * (a) Inngest pipeline 'extract-transcript' đọc được,
 * (b) RAG chunking + embeddings chạy sau,
 * (c) re-generate note không phải trích xuất lại.
 */

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
const INLINE_LIMIT = 18 * 1024 * 1024; // Gemini inline data limit ~20MB, giữ 18MB an toàn

export interface ExtractResult {
  text: string;
  stored: boolean;
  sourceId?: string;
}

interface SourceInput {
  type: 'pdf' | 'youtube' | 'audio' | 'doc' | 'image' | 'video' | 'text';
  name: string;
  url?: string;
  content?: string;
}

/** Đoán mime từ tên file — R2 presign đã validate whitelist nên đủ dùng. */
function guessMime(name: string, fallbackType: string): string {
  const ext = name.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    ogg: 'audio/ogg', weba: 'audio/webm',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    webp: 'image/webp', gif: 'image/gif',
  };
  return map[ext] || (fallbackType === 'audio' ? 'audio/mpeg' : fallbackType === 'video' ? 'video/mp4' : 'application/octet-stream');
}

async function callGeminiExtract(apiKey: string, prompt: string, parts: object[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [...parts, { text: prompt }] as any }],
        config: { temperature: 0.1 },
      });
      return res.text || '';
    } catch (e) {
      lastErr = e;
      console.warn(`[extract] model ${model} failed:`, e instanceof Error ? e.message : e);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('All Gemini extraction models failed');
}

/** Tìm source row trong DB theo url hoặc tên file. */
async function findSourceRow(url?: string, name?: string): Promise<{ id: string } | null> {
  if (!url && !name) return null;
  const sql = getSql();
  try {
    const rows = url
      ? (await sql`select id from sources where file_url = ${url} or original_url = ${url} order by created_at desc limit 1`) as { id: string }[]
      : (await sql`select id from sources where file_name = ${name!} order by created_at desc limit 1`) as { id: string }[];
    return rows[0] || null;
  } catch {
    return null; // DB lookup là best-effort — không chặn extraction
  }
}

export async function saveTranscript(sourceId: string, transcript: string): Promise<void> {
  const sql = getSql();
  await sql`
    update sources set transcript = ${transcript}, status = 'processed', updated_at = now()
    where id = ${sourceId}
  `;
}

/**
 * Trích xuất nội dung 1 nguồn. Fail của 1 nguồn KHÔNG làm chết cả request —
 * trả về error text để AI biết và nói thật với user.
 */
export async function extractSource(
  src: SourceInput,
  apiKey: string
): Promise<ExtractResult> {
  // 1) Client đã trích xuất sẵn (txt/md/code/paste) → passthrough
  if (src.content && src.content.trim().length > 50) {
    return { text: src.content, stored: false };
  }

  // 2) YouTube link → Gemini native (đọc trực tiếp video, có cả audio track)
  if (src.type === 'youtube' && src.url) {
    const text = await callGeminiExtract(
      apiKey,
      'Trích xuất TOÀN BỘ lời thoại/nội dung của video này thành transcript văn bản thuần, giữ thứ tự. Chỉ trả về transcript, không bình luận.',
      [{ fileData: { fileUri: src.url } }]
    );
    return { text, stored: false };
  }

  // 3) Web article → r.jina.ai reader
  if ((src.type === 'text' || src.type === 'doc') && src.url && !src.content) {
    try {
      const readerUrl = `https://r.jina.ai/${src.url}`;
      const res = await fetch(readerUrl, {
        signal: AbortSignal.timeout(30_000),
        headers: { 'X-Return-Format': 'text' },
      });
      if (!res.ok) throw new Error(`reader HTTP ${res.status}`);
      return { text: await res.text(), stored: false };
    } catch (e) {
      return {
        text: `[Không đọc được trang web "${src.name}": ${e instanceof Error ? e.message : e}]`,
        stored: false,
      };
    }
  }

  // 4) Binary (pdf/audio/video/image) từ R2 → download → Gemini multimodal
  if (src.url) {
    const row = await findSourceRow(src.url, src.name);
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`download HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());

      let text: string;
      const isDocx = src.name.toLowerCase().endsWith('.docx');
      const isPptx = src.name.toLowerCase().endsWith('.pptx');
      if (isDocx) {
        const mammoth = await import('mammoth');
        const { value } = await mammoth.extractRawText({ buffer: buf });
        text = value;
      } else if (isPptx) {
        // PARSE_PPTX (PRD 4.0.2): slide-by-slide qua jszip — không tốn Gemini call,
        // giữ speaker notes làm evidence; chỉ khi rỗng mới fallback Gemini OCR.
        const { parsePptx, renderPptxMarkdown } = await import('./pptx');
        const slides = await parsePptx(buf);
        text = renderPptxMarkdown(slides);
        if (!text.trim()) {
          text = await callGeminiExtract(
            apiKey,
            'Trích xuất TOÀN BỘ nội dung văn bản của tài liệu này. Giữ đúng cấu trúc và thứ tự. Chỉ trả về nội dung.',
            [{ inlineData: { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', data: buf.toString('base64') } }]
          );
        }
      } else if (buf.length <= INLINE_LIMIT) {
        const mime = guessMime(src.name, src.type);
        text = await callGeminiExtract(
          apiKey,
          src.type === 'audio' || src.type === 'video'
            ? 'Transcribe TOÀN BỘ nội dung audio/video này thành văn bản thuần, giữ thứ tự lời nói. Nếu có nhiều người nói, phân biệt người nói khi rõ ràng. Chỉ trả về transcript.'
            : src.type === 'image'
              ? 'Mô tả đầy đủ và trích xuất toàn bộ nội dung văn bản (OCR) trong ảnh này.'
              : 'Trích xuất TOÀN BỘ nội dung văn bản của tài liệu này (bao gồm tiêu đề, đề mục, bảng biểu dạng text). Giữ đúng cấu trúc và thứ tự. Chỉ trả về nội dung.',
          [{ inlineData: { mimeType: mime, data: buf.toString('base64') } }]
        );
      } else {
        // >18MB: chưa hỗ trợ chunked STT qua pipeline dài (TODO MediaProcessor)
        return {
          text: `[Tệp "${src.name}" (${Math.round(buf.length / 1024 / 1024)}MB) vượt giới hạn xử lý trực tiếp 18MB. Hãy chia nhỏ tệp hoặc dùng bản chất lượng thấp hơn.]`,
          stored: false,
        };
      }

      if (row && text) await saveTranscript(row.id, text);
      return { text, stored: !!row };
    } catch (e) {
      return {
        text: `[Không đọc được tệp "${src.name}": ${e instanceof Error ? e.message : e}]`,
        stored: false,
      };
    }
  }

  return { text: `[Nguồn "${src.name}" không có nội dung cũng như URL để đọc.]`, stored: false };
}

/** Trích xuất tuần tự nhiều nguồn (giới hạn rate Gemini), gộp kết quả. */
export async function extractAllSources(
  sources: SourceInput[],
  apiKey: string
): Promise<{
  combined: string;
  extractedCount: number;
  failedCount: number;
  /** Per-source content — dùng cho hierarchical map-reduce (lib/ai/summarize.ts) */
  perSource: Array<{ sourceName: string; sourceType: string; content: string }>;
}> {
  const results: string[] = [];
  const perSource: Array<{ sourceName: string; sourceType: string; content: string }> = [];
  let ok = 0;
  let failed = 0;
  for (const src of sources.slice(0, 5)) { // cap 5 nguồn/request chống abuse + timeout
    const r = await extractSource(src, apiKey);
    if (r.text.startsWith('[') && r.text.includes('Không')) failed++;
    else ok++;
    results.push(r.text);
    perSource.push({ sourceName: src.name, sourceType: src.type, content: r.text });
  }
  return { combined: results.join('\n\n'), extractedCount: ok, failedCount: failed, perSource };
}

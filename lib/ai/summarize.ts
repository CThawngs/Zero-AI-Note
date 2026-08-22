/**
 * Hierarchical Summarization (PRD 4.0.8 + 3.2d Stage 3-5, 2026-08-23)
 *
 * Map-Reduce 2 tầng cho N nguồn:
 *   Stage MAP:    mỗi source → section summary (compression giữ evidence)
 *   Stage REDUCE: section summaries → file-level synthesis (+ conflict detection)
 *
 * Nguyên tắc 4.0.8: KHÔNG flatten summary→summary mất evidence — mỗi section
 * summary giữ trích dẫn gốc (evidence) + source name; file summary ghi rõ
 * từng nguồn đóng góp. Cross-file conflicts KHÔNG tự chọn truth (4.0.10) —
 * liệt kê cả các phía trong note.
 *
 * Chỉ kích hoạt khi tổng nội dung > ngưỡng (mặc định 24k chars ≈ 6k tokens):
 * dưới ngưỡng thì pipeline cũ nhét thẳng đủ nhanh và rẻ hơn.
 */

export interface SourceSection {
  /** Tên nguồn (file name / URL / YouTube title...) */
  sourceName: string;
  sourceType: string;
  /** Nội dung đã extract của nguồn này */
  content: string;
}

export interface SectionSummary {
  sourceName: string;
  sourceType: string;
  /** Tóm tắt có cấu trúc của nguồn */
  summary: string;
  /** Trích dẫn gốc làm evidence (không qua LLM thêm lần nữa) */
  keyQuotes: string[];
}

export interface HierarchicalResult {
  mode: 'hierarchical' | 'single-pass';
  reason?: string;
  sectionSummaries: SectionSummary[];
  /** Synthesis cuối đưa vào prompt tạo note */
  synthesizedContext: string;
  conflicts: Array<{ topic: string; sides: Array<{ sourceName: string; claim: string }> }>;
}

/** Ngưỡng kích hoạt hierarchical: tổng chars toàn sources */
const HIERARCHICAL_THRESHOLD = 24_000;

/** Cap chars/source khi map (đủ cho summary, tránh nổ context) */
const PER_SOURCE_CAP = 60_000;

export function splitIntoSections(content: string): string[] {
  // Ưu tiên cắt theo heading markdown; fallback theo đoạn ~1800 chars
  const byHeading = content.split(/\n(?=#{1,3}\s)/);
  const sections = byHeading.filter(s => s.trim().length > 0);
  if (sections.length >= 2) return sections.slice(0, 24);
  // fallback: chunk cứng
  const chunks: string[] = [];
  for (let i = 0; i < content.length && chunks.length < 24; i += 1_800) {
    chunks.push(content.slice(i, i + 1_800));
  }
  return chunks.length > 0 ? chunks : [content];
}

export function heuristicKeyQuotes(content: string, max = 3): string[] {
  // Heuristic rẻ (không LLM): câu chứa số/liệt kê/dòng bắt đầu bằng "- " thường là claim quan trọng
  const candidates = content
    .split(/(?<=[.!?])\s+|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 400);
  const scored = candidates
    .map(s => ({ s, score: (/\d/.test(s) ? 2 : 0) + (/^[-•*]/.test(s) ? 1 : 0) + (/%|\$|đồng|USD|VND/i.test(s) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map(x => x.s);
}

export function shouldUseHierarchical(totalChars: number, sourceCount: number): boolean {
  return totalChars > HIERARCHICAL_THRESHOLD || sourceCount > 3;
}

/**
 * Stage MAP: tóm tắt từng source bằng chính dispatcher chat (chatOnly).
 * Dùng model user đang chọn — không hardcode provider.
 */
async function mapSource(
  src: SourceSection,
  language: 'vi' | 'en'
): Promise<SectionSummary> {
  const { generateOpenRouterFreeResponse } = await import('./openrouter-fallback');
  const { dispatchAgentResponse } = await import('./dispatcher');

  const capped = src.content.slice(0, PER_SOURCE_CAP);
  const prompt =
    language === 'vi'
      ? `Tóm tắt nguồn "${src.sourceName}" (${src.sourceType}) thành tối đa 12 bullet points, giữ nguyên SỐ LIỆU, THUẬT NGỮ, TÊN RIÊNG. Không bịa thêm thông tin không có trong nguồn.`
      : `Summarize source "${src.sourceName}" (${src.sourceType}) into max 12 bullets, preserving exact NUMBERS, TERMS and PROPER NOUNS. Never invent facts.`;

  let summaryText = '';
  try {
    // Ưu tiên model đang active qua dispatcher (BYOK đồng nhất), chế độ chat thuần
    const res = await dispatchAgentResponse({
      inputText: `${prompt}\n\n=== NỘI DUNG NGUỒN ===\n${capped}`,
      method: 'auto',
      language,
      isInternalTask: true, // bỏ agent-tools pass: tóm tắt nội bộ không cần web/weather tools
    });
    summaryText = res.replyText || '';
  } catch {
    // fallback tầng 4
    try {
      const fb = await generateOpenRouterFreeResponse({
        inputText: `${prompt}\n\n=== NỘI DUNG NGUỒN ===\n${capped}`,
        method: 'auto',
        language,
        chatOnly: true,
      });
      summaryText = fb.replyText || '';
    } catch {
      summaryText = '';
    }
  }

  if (!summaryText) {
    // Fail-soft: dùng heuristic compression thay vì chết pipeline
    summaryText = capped.slice(0, 3_000);
  }

  return {
    sourceName: src.sourceName,
    sourceType: src.sourceType,
    summary: summaryText,
    keyQuotes: heuristicKeyQuotes(capped),
  };
}

/**
 * Stage REDUCE: phát hiện conflict số liệu giữa các nguồn (4.0.10).
 * Heuristic: cùng "topic keyword" nhưng giá trị số khác nhau → liệt kê cả 2 phía.
 * KHÔNG tự chọn truth.
 */
export function detectConflicts(sections: SectionSummary[]): HierarchicalResult['conflicts'] {
  const conflicts: HierarchicalResult['conflicts'] = [];
  const numberClaims: Array<{ source: string; sentence: string; nums: number[] }> = [];

  for (const sec of sections) {
    for (const q of [...sec.keyQuotes, ...sec.summary.split('\n')]) {
      const nums = (q.match(/\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')));
      if (nums.length > 0 && q.length < 300) {
        numberClaims.push({ source: sec.sourceName, sentence: q.trim(), nums });
      }
    }
  }

  // So cặp: cùng chứa ít nhất 1 số, chênh lệch số lớn nhất >20%, khác nguồn
  for (let i = 0; i < numberClaims.length; i++) {
    for (let j = i + 1; j < numberClaims.length; j++) {
      const a = numberClaims[i];
      const b = numberClaims[j];
      if (a.source === b.source) continue;
      const shared = a.nums.filter(n => b.nums.some(m => m !== n && Math.abs(n - m) / Math.max(n, m) > 0.2));
      if (shared.length === 0) continue;
      const wordOverlap = a.sentence
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(w => w.length >= 3 && b.sentence.toLowerCase().includes(w));
      if (wordOverlap.length < 2) continue;
      conflicts.push({
        topic: wordOverlap.slice(0, 3).join(' '),
        sides: [
          { sourceName: a.source, claim: a.sentence },
          { sourceName: b.source, claim: b.sentence },
        ],
      });
      if (conflicts.length >= 8) return conflicts; // cap chống nhiễu
    }
  }
  return conflicts;
}

export async function runHierarchicalSummarization(
  sections: SourceSection[],
  language: 'vi' | 'en'
): Promise<HierarchicalResult> {
  const totalChars = sections.reduce((acc, s) => acc + s.content.length, 0);
  if (!shouldUseHierarchical(totalChars, sections.length)) {
    return {
      mode: 'single-pass',
      reason: `Tổng ${totalChars} chars / ${sections.length} nguồn — dưới ngưỡng hierarchical, pipeline cũ đủ`,
      sectionSummaries: [],
      synthesizedContext: '',
      conflicts: [],
    };
  }

  // MAP (tuần tự để tôn trọng rate-limit free tier; N ≤ 5 do extract cap)
  const summaries: SectionSummary[] = [];
  for (const src of sections) {
    const s = await mapSource(src, language);
    summaries.push(s);
  }

  // REDUCE: conflict detection heuristic
  const conflicts = detectConflicts(summaries);

  // Synthesized context: ghép section summaries + evidence quotes + conflicts
  let ctx = '';
  ctx += `=== TỔNG HỢP PHÂN TẠCH (${summaries.length} nguồn, hierarchical map-reduce) ===\n\n`;
  for (const s of summaries) {
    ctx += `--- NGUỒN: ${s.sourceName} (${s.sourceType}) ---\n${s.summary}\n`;
    if (s.keyQuotes.length > 0) {
      ctx += `Trích dẫn gốc làm bằng chứng:\n${s.keyQuotes.map(q => `- "${q}"`).join('\n')}\n`;
    }
    ctx += '\n';
  }
  if (conflicts.length > 0) {
    ctx += `⚠️ XUNG ĐỘT SỐ LIỆU GIỮA CÁC NGUỒN (KHÔNG tự chọn bên đúng — liệt kê trung lập trong note):\n`;
    for (const c of conflicts) {
      ctx += `- Chủ đề "${c.topic}":\n${c.sides.map(sd => `  • ${sd.sourceName}: "${sd.claim}"`).join('\n')}\n`;
    }
    ctx += '\n';
  }
  ctx += '=== KẾT THÚC TỔNG HỢP ===';

  return {
    mode: 'hierarchical',
    sectionSummaries: summaries,
    synthesizedContext: ctx,
    conflicts,
  };
}

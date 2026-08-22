/**
 * Knowledge Objects extraction + Coverage Ledger (PRD 4.0.7/4.0.9, 2026-08-23)
 *
 * EXTRACT_KNOWLEDGE: mỗi source → 1 knowledge object (facts/topics/entities/
 * numbers/quotes...) qua dispatcher JSON, lưu bảng knowledge_objects.
 * Coverage: coverage_ledger track extracted → knowledge_extracted →
 * section_included → note_included cho từng source.
 *
 * Fail-soft: KO extraction chết không chặn pipeline note — chỉ log + ledger
 * đánh extracted=false.
 */

export interface KnowledgeObject {
  summary: string;
  facts: string[];
  topics: string[];
  entities: Record<string, unknown>;
  numbers: string[];
  dates: string[];
  decisions: string[];
  action_items: string[];
  questions: string[];
  quotes: string[];
}

const EMPTY_KO: KnowledgeObject = {
  summary: '', facts: [], topics: [], entities: {}, numbers: [],
  dates: [], decisions: [], action_items: [], questions: [], quotes: [],
};

type Sql = ReturnType<typeof import('@/lib/db').getSql>;

/** Kiểm tra source_id tồn tại thật trong sources — client có thể gửi id tự chế. */
async function sourceExists(sql: Sql, sourceId: string): Promise<boolean> {
  const rows = (await sql`select 1 from sources where id = ${sourceId} limit 1`) as unknown[];
  return rows.length > 0;
}

/** Upsert coverage row cho source; trả id. Idempotent theo source_id.
 *  sourceId không tồn tại trong sources → bỏ qua (tránh FK violation). */
export async function upsertCoverage(
  sql: Sql,
  data: { userId: string; sourceId: string | null; notebookId: string | null }
): Promise<boolean> {
  if (!data.sourceId) return false;
  try {
    if (!(await sourceExists(sql, data.sourceId))) return false;
    await sql`
      insert into coverage_ledger (user_id, source_id, notebook_id, extracted)
      values (${data.userId}::uuid, ${data.sourceId}::uuid, ${data.notebookId}::uuid, true)
      on conflict do nothing
    `;
    return true;
  } catch (err) {
    console.warn('[KO] upsertCoverage skipped:', err);
    return false;
  }
}

/** Đánh dấu 1 cờ coverage=true cho source (idempotent). */
export async function markCoverage(
  sql: Sql,
  sourceId: string | null,
  column: 'knowledge_extracted' | 'section_included' | 'note_included'
): Promise<void> {
  if (!sourceId) return;
  try {
    const col = { knowledge_extracted: 'knowledge_extracted', section_included: 'section_included', note_included: 'note_included' }[column];
    await sql.query(`update coverage_ledger set ${col} = true, updated_at = now() where source_id::text = $1`, [sourceId]);
  } catch (err) {
    console.warn('[KO] markCoverage skipped:', err);
  }
}

/** Coverage % của notebook — dùng cho ProcessingCard/Stepper sau này. */
export async function getNotebookCoverage(
  sql: Sql,
  notebookId: string
): Promise<{ total: number; fullyCovered: number; pct: number }> {
  const rows = (await sql`
    select count(*)::int as total,
           sum(case when knowledge_extracted and note_included then 1 else 0 end)::int as covered
    from coverage_ledger where notebook_id::text = ${notebookId}
  `) as unknown as Array<{ total: number; covered: number | null }>;
  const total = rows[0]?.total ?? 0;
  const covered = rows[0]?.covered ?? 0;
  return { total, fullyCovered: covered, pct: total > 0 ? Math.round((covered * 100) / total) : 0 };
}

/**
 * EXTRACT_KNOWLEDGE từ nội dung đã extract của 1 source.
 * Dùng dispatcher chatOnly-style (isInternalTask) yêu cầu JSON nghiêm ngặt;
 * parse fail → heuristic fallback từ summarize.keyQuotes nếu có.
 */
export async function extractKnowledgeObject(opts: {
  inputText: string;
  sourceName: string;
  language: 'vi' | 'en';
}): Promise<KnowledgeObject> {
  const { dispatchAgentResponse } = await import('./dispatcher');

  const prompt =
    opts.language === 'vi'
      ? `Trích xuất kiến thức có cấu trúc từ nguồn "${opts.sourceName}". Trả về CHỈ JSON hợp lệ đúng schema:
{"summary": "1-2 câu", "facts": ["..."], "topics": ["..."], "entities": {"người": [], "tổ chức": [], "sản phẩm": []}, "numbers": [{"value": "...", "context": "..."}], "dates": ["..."], "decisions": ["..."], "action_items": ["..."], "questions": ["câu hỏi chưa trả lời"], "quotes": ["trích dẫn gốc quan trọng"]}`
      : `Extract structured knowledge from source "${opts.sourceName}". Return ONLY valid JSON matching schema:
{"summary": "1-2 sentences", "facts": ["..."], "topics": ["..."], "entities": {"people": [], "orgs": [], "products": []}, "numbers": [{"value": "...", "context": "..."}], "dates": ["..."], "decisions": ["..."], "action_items": ["..."], "questions": ["unanswered questions"], "quotes": ["important verbatim quotes"]}`;

  try {
    const res = await dispatchAgentResponse({
      inputText: `${prompt}\n\n=== NỘI DUNG NGUỒN ===\n${opts.inputText.slice(0, 60_000)}`,
      method: 'auto',
      language: opts.language,
      isInternalTask: true,
    });
    // Bóc JSON khỏi markdown fence nếu model bọc ```json
    const raw = (res.replyText || '').replace(/```json?\s*|\s*```/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('no JSON in reply');
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      facts: arr(parsed.facts), topics: arr(parsed.topics),
      entities: typeof parsed.entities === 'object' && parsed.entities ? parsed.entities : {},
      numbers: arrNumbers(parsed.numbers), dates: arr(parsed.dates),
      decisions: arr(parsed.decisions), action_items: arr(parsed.action_items),
      questions: arr(parsed.questions), quotes: arr(parsed.quotes),
    };
  } catch (err) {
    console.warn('[KO] extraction failed, saving empty shell:', err);
    return EMPTY_KO;
  }
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(x => String(x)).slice(0, 50) : [];
}
function arrNumbers(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map(x => (typeof x === 'object' && x !== null ? `${(x as any).value ?? ''}|${(x as any).context ?? ''}` : String(x)))
    .slice(0, 50);
}

/** Lưu KO vào DB (insert mới mỗi lần — re-extract tạo version mới, không update mất dữ liệu cũ). */
export async function saveKnowledgeObject(
  sql: Sql,
  data: { userId: string; sourceId: string | null; notebookId: string | null; ko: KnowledgeObject; model?: string }
): Promise<string | null> {
  if (!data.sourceId) return null;
  try {
    if (!(await sourceExists(sql, data.sourceId))) return null;
    const rows = (await sql`
      insert into knowledge_objects
        (user_id, source_id, notebook_id, summary, facts, topics, entities, numbers, dates, decisions, action_items, questions, quotes, model_version)
      values
        (${data.userId}::uuid, ${data.sourceId}::uuid, ${data.notebookId}::uuid,
         ${data.ko.summary}, ${data.ko.facts}, ${data.ko.topics},
         ${JSON.stringify(data.ko.entities)}::jsonb,
         ${data.ko.numbers}, ${data.ko.dates}, ${data.ko.decisions},
         ${data.ko.action_items}, ${data.ko.questions}, ${data.ko.quotes},
         ${data.model ?? 'unknown'})
      returning id
    `) as unknown as Array<{ id: string }>;
    return rows[0]?.id ?? null;
  } catch (err) {
    console.warn('[KO] save failed:', err);
    return null;
  }
}

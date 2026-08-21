import { NoteOutputSchema, NoteOutput } from './block-schema';

const MAX_REPAIR_RETRIES = 2;

export interface RepairResult {
  ok: boolean;
  data: NoteOutput | null;
  error?: string;
  attempts: number;
}

/**
 * Extract first JSON object/array substring from text output.
 * Loại bỏ markdown fence, leading/trailing whitespace, LLM chatter.
 */
export function extractJsonCandidate(rawText: string): string | null {
  if (!rawText) return null;
  let text = rawText.trim();

  // Remove markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // Find first { and last } (greedy JSON object)
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }

  // Find first [ and last ] (JSON array)
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return text.substring(firstBracket, lastBracket + 1);
  }

  return null;
}

/**
 * Parse JSON safely. If parse fails, try to fix common LLM errors:
 * - trailing commas
 * - unescaped newlines in strings
 */
export function safeParseJson(rawText: string): { ok: boolean; data: any; error?: string } {
  const candidate = extractJsonCandidate(rawText);
  if (!candidate) {
    return { ok: false, data: null, error: 'No JSON candidate found in LLM output' };
  }

  try {
    return { ok: true, data: JSON.parse(candidate) };
  } catch (parseErr) {
    // Try to fix trailing commas
    let fixed = candidate.replace(/,(\s*[}\]])/g, '$1');
    try {
      return { ok: true, data: JSON.parse(fixed) };
    } catch (err2) {
      return { ok: false, data: null, error: `JSON parse failed: ${(parseErr as Error).message}` };
    }
  }
}

/**
 * Auto-repair loop. Nếu JSON hợp lệ nhưng thiếu trường bắt buộc (theo NoteOutputSchema),
 * gửi lại đoạn JSON kèm error cho LLM với max 2 lần retry.
 */
export async function validateAndRepair(
  rawText: string,
  repairCallback: (malformedJson: string, error: string) => Promise<string>,
): Promise<RepairResult> {
  let currentText = rawText;
  let attempts = 0;
  let lastError = '';

  while (attempts <= MAX_REPAIR_RETRIES) {
    const parsed = safeParseJson(currentText);
    if (!parsed.ok) {
      lastError = parsed.error || 'Unknown parse error';
      attempts += 1;
      if (attempts > MAX_REPAIR_RETRIES) break;
      try {
        currentText = await repairCallback(currentText, lastError);
        if (!currentText) break;
      } catch {
        break;
      }
      continue;
    }

    const validation = NoteOutputSchema.safeParse(parsed.data);
    if (validation.success) {
      return { ok: true, data: validation.data, attempts };
    }

    lastError = validation.error.issues
      .map((i) => `[${i.path.join('.')}] ${i.message}`)
      .slice(0, 3)
      .join('; ');
    attempts += 1;
    if (attempts > MAX_REPAIR_RETRIES) break;

    try {
      currentText = await repairCallback(JSON.stringify(parsed.data, null, 2), lastError);
      if (!currentText) break;
    } catch {
      break;
    }
  }

  return {
    ok: false,
    data: null,
    error: `Failed to repair after ${MAX_REPAIR_RETRIES} retries. Last error: ${lastError}`,
    attempts,
  };
}

/**
 * Build repair prompt for LLM (note generator)
 */
export function buildRepairPrompt(malformedJson: string, errorMessage: string): string {
  return `Your previous JSON output failed validation with the following errors:

ERRORS:
${errorMessage}

MALFORMED JSON:
\`\`\`json
${malformedJson}
\`\`\`

Please respond with ONLY the corrected JSON object (no markdown fences, no explanations). Ensure:
- All required fields are present: meta.title, meta.method, meta.tier, meta.language, meta.summary, meta.keywords (array), meta.coreQuestions (array), blocks (array)
- Each block must have a valid "type" field: heading | paragraph | cue_box | table | card_grid | callout | mindmap_tree
- Strings must not contain unescaped newlines

Return ONLY the raw JSON object.`;
}

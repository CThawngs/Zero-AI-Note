import { NoteOutput, Block } from '@/lib/ai/validators/block-schema';
import { StructuredNoteOutput } from '@/lib/ai/gemini';

/**
 * Convert old StructuredNoteOutput (legacy fields like cue, note, question, answer, bulletPoints)
 * sang NoteOutput mới với mảng blocks chuẩn.
 * Dùng để tương thích ngược khi các API cũ vẫn trả về định dạng cũ.
 */
export function adaptLegacyNoteToNoteOutput(legacy: StructuredNoteOutput): NoteOutput {
  const blocks: Block[] = [];

  // 1. Heading tiêu đề
  blocks.push({ type: 'heading', level: 1, text: legacy.title });

  // 2. Phần overview (paragraph)
  if (legacy.content?.overview) {
    blocks.push({ type: 'paragraph', text: legacy.content.overview });
  }

  // 3. Sections → các block tương ứng theo method
  const method = legacy.method;
  const sections = legacy.content?.sections || [];

  sections.forEach((s, idx) => {
    const headingLevel = idx === 0 ? 2 : 2;
    if (s.title) {
      blocks.push({ type: 'heading', level: headingLevel, text: s.title });
    }

    // Cornell: cue_box
    if (method === 'cornell' || method === 'allinone') {
      if (s.cue || s.note) {
        const notes: string[] = [];
        if (s.note) notes.push(s.note);
        if (s.bulletPoints && s.bulletPoints.length) notes.push(...s.bulletPoints);
        if (s.text) notes.push(s.text);
        if (notes.length) {
          blocks.push({
            type: 'cue_box',
            cue: s.cue || s.title || '',
            notes,
          });
        }
      }
    }

    // Q&A / Flashcard: card_grid
    if ((method === 'qa' || method === 'flashcard') && (s.question || s.answer)) {
      blocks.push({
        type: 'card_grid',
        cards: [{ front: s.question || '', back: s.answer || '' }],
      });
    }

    // Charting / Syntopical / Meeting: table
    if ((method === 'charting' || method === 'syntopical' || method === 'meeting') && s.tableData) {
      blocks.push({
        type: 'table',
        headers: s.tableData.headers,
        rows: s.tableData.rows.map((row) => row.map((c) => String(c ?? ''))),
      });
    }

    // Definition (Lecture)
    if (s.definition) {
      blocks.push({
        type: 'callout',
        style: 'info',
        title: 'Định nghĩa',
        text: s.definition,
      });
    }

    // Bullet points (Outline, Mindmap, Lecture, Analysis)
    if (s.bulletPoints && s.bulletPoints.length && method !== 'cornell') {
      // Outline / Mindmap: dùng paragraph với bullet string
      blocks.push({
        type: 'paragraph',
        text: s.bulletPoints.map((b) => `• ${b}`).join('\n'),
      });
    }

    // Text content
    if (s.text && method !== 'cornell' && !s.bulletPoints?.length) {
      blocks.push({ type: 'paragraph', text: s.text });
    }
  });

  // 4. Summary callout
  if (legacy.content?.summaryText) {
    blocks.push({
      type: 'callout',
      style: 'tip',
      title: 'Tóm tắt cốt lõi',
      text: legacy.content.summaryText,
    });
  }

  return {
    meta: {
      title: legacy.title,
      method: legacy.method,
      tier: legacy.category ? 'free' : 'free',
      language: 'vi',
      summary: legacy.summary,
      keywords: legacy.keywords || [],
      coreQuestions: legacy.coreQuestions || [],
    },
    blocks,
  };
}

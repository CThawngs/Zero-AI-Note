/**
 * Structuring Map-Reduce - Tầng 2: Chia transcript dài thành các section 3.000-5.000 từ
 * Note Generator sinh Local Blocks từng section (Map Phase)
 * Sau đó gộp và tạo Executive Overview + Glossary (Reduce/Polish Phase)
 */

import { NoteOutput, Block } from '@/lib/ai/validators/block-schema';
import { TemplateConfig } from '@/lib/templates/registry';
import { buildMapPhasePrompt, buildReducePhasePrompt } from '@/lib/ai/prompts/note-generator';
import { validateAndRepair, buildRepairPrompt } from '@/lib/ai/validators/repair-loop';

export interface SectionChunks {
  sectionIndex: number;
  totalSections: number;
  text: string;
  approxWordCount: number;
}

export interface LocalBlocksSummary {
  sectionIndex: number;
  title: string;
  blockCount: number;
  summary: string;
}

/**
 * Chia transcript thành các section 3.000-5.000 từ (hoặc ~25.000-40.000 ký tự)
 */
export function splitTranscriptIntoSections(transcript: string, targetWordsPerSection = 4000): SectionChunks[] {
  const totalWords = transcript.split(/\s+/).length;
  const totalSections = Math.max(1, Math.ceil(totalWords / targetWordsPerSection));
  const wordsPerSection = Math.ceil(totalWords / totalSections);

  const sentences = transcript.split(/(?<=[.!?])\s+/);
  const sections: SectionChunks[] = [];
  let buffer: string[] = [];
  let wordCount = 0;

  sentences.forEach((sentence) => {
    const sentenceWords = sentence.split(/\s+/).length;
    if (wordCount + sentenceWords > wordsPerSection && buffer.length > 0) {
      sections.push(createSection(sections.length + 1, totalSections, buffer.join(' '), wordCount));
      buffer = [];
      wordCount = 0;
    }
    buffer.push(sentence);
    wordCount += sentenceWords;
  });

  if (buffer.length > 0) {
    sections.push(createSection(sections.length + 1, totalSections, buffer.join(' '), wordCount));
  }

  return sections;
}

function createSection(idx: number, total: number, text: string, wordCount: number): SectionChunks {
  return {
    sectionIndex: idx,
    totalSections: total,
    text,
    approxWordCount: wordCount,
  };
}

export interface StructuringMapReduceParams {
  template: TemplateConfig;
  transcript: string;
  language: 'vi' | 'en';
  generateBlocksFn: (prompt: string) => Promise<string>; // Gọi LLM
}

export interface StructuringMapReduceResult {
  meta: NoteOutput['meta'];
  blocks: Block[];
}

/**
 * Map-Reduce toàn tầng 2. Mỗi section → Local Blocks. Sau đó Reduce gộp thành Global Note.
 */
export async function runStructuringMapReduce(
  params: StructuringMapReduceParams,
): Promise<StructuringMapReduceResult> {
  const sections = splitTranscriptIntoSections(params.transcript);

  // ===== MAP PHASE =====
  const localBlocksPerSection: Array<{ sectionIndex: number; note: NoteOutput }> = [];

  for (const section of sections) {
    const prompt = buildMapPhasePrompt({
      template: params.template,
      transcript: section.text,
      language: params.language,
      sectionIndex: section.sectionIndex,
      totalSections: section.totalSections,
    });

    const raw = await params.generateBlocksFn(prompt);
    const repairCallback = async (malformed: string, err: string) => {
      return params.generateBlocksFn(buildRepairPrompt(malformed, err));
    };
    const repair = await validateAndRepair(raw, repairCallback);

    if (!repair.ok || !repair.data) {
      console.warn(`[Structuring] Section ${section.sectionIndex} repair failed: ${repair.error}`);
      continue;
    }
    localBlocksPerSection.push({ sectionIndex: section.sectionIndex, note: repair.data });
  }

  // ===== REDUCE/POLISH PHASE =====
  const localSummaries: LocalBlocksSummary[] = localBlocksPerSection.map((s) => ({
    sectionIndex: s.sectionIndex,
    title: s.note.meta.title,
    blockCount: s.note.blocks.length,
    summary: s.note.meta.summary,
  }));

  const reducePrompt = buildReducePhasePrompt(params.template, localSummaries, params.language);
  const reduceRaw = await params.generateBlocksFn(reducePrompt);
  const reduceRepairCallback = async (malformed: string, err: string) =>
    params.generateBlocksFn(buildRepairPrompt(malformed, err));
  const reduceRepair = await validateAndRepair(reduceRaw, reduceRepairCallback);

  const meta =
    reduceRepair.ok && reduceRepair.data
      ? reduceRepair.data.meta
      : localBlocksPerSection[0]?.note.meta || {
          title: 'Synthesized Note',
          method: params.template.id,
          tier: params.template.tier,
          language: params.language,
          summary: '',
          keywords: [],
          coreQuestions: [],
        };

  const allBlocks: Block[] = localBlocksPerSection.flatMap((s) => s.note.blocks);

  return { meta, blocks: allBlocks };
}

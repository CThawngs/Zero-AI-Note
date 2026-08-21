/**
 * Note Generator Engine — Headless JSON Generator (No Chat, No Filler)
 *
 * Trách nhiệm: Nhận transcript và sinh mảng Block-based JSON thuần túy
 * phục vụ trực tiếp cho Universal Export Engine.
 * Không chào hỏi, không thêm văn bản mở đầu/kết thúc.
 */

import { TemplateConfig } from '@/lib/templates/registry';

export interface NoteGeneratorParams {
  template: TemplateConfig;
  transcript: string;
  language: 'vi' | 'en';
  sectionIndex?: number;
  totalSections?: number;
}

/**
 * System prompt headless — buộc output 100% JSON hợp lệ theo Universal Block Schema
 */
export function buildNoteGeneratorSystemPrompt(template: TemplateConfig): string {
  const requiredBlocksList = template.requiredBlocks.join(', ');

  return `You are a Headless Academic Note Structuring Engine for Zero AI Note.
Method: ${template.name} (${template.id.toUpperCase()})
Required Block Types: [${requiredBlocksList}]

CRITICAL OPERATING RULES:
1. HEADLESS MODE: DO NOT output any conversational text, greetings, explanations, or markdown code blocks (NO \`\`\`json wrappers).
2. OUTPUT FORMAT: A single valid JSON object strictly adhering to the Universal Block Schema.
3. COMPLETENESS: Never summarize loosely. Extract high-density structured facts.
4. METHOD ENFORCEMENT:
${template.systemInstruction}

UNIVERSAL BLOCK SCHEMA:
{
  "meta": {
    "title": "Clear Academic Title",
    "method": "${template.id}",
    "tier": "${template.tier}",
    "language": "vi" | "en",
    "summary": "1-3 sentence core summary",
    "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "coreQuestions": ["Question 1?", "Question 2?", "Question 3?"]
  },
  "blocks": [
    // Array of typed blocks matching requiredBlocks:
    // { "type": "heading", "level": 1 | 2 | 3, "text": "..." }
    // { "type": "paragraph", "text": "..." }
    // { "type": "cue_box", "cue": "Left cue/keyword", "notes": ["Right detail 1", "Right detail 2"], "timestamp": 120 }
    // { "type": "table", "headers": ["Col 1", "Col 2"], "rows": [["Val 1", "Val 2"]] }
    // { "type": "card_grid", "cards": [{ "front": "Term", "back": "Definition", "tag": "..." }] }
    // { "type": "callout", "style": "info" | "warning" | "tip", "title": "...", "text": "..." }
    // { "type": "mindmap_tree", "root": { "label": "Center", "children": [{ "label": "Branch 1" }] } }
  ]
}`;
}

/**
 * Prompt Map Phase: Xử lý 1 Section cụ thể trong Transcript dài (3.000–5.000 từ)
 */
export function buildMapPhasePrompt(
  params: NoteGeneratorParams,
): string {
  const { template, transcript, language, sectionIndex = 1, totalSections = 1 } = params;

  return `[MAP PHASE: Section ${sectionIndex}/${totalSections}]
Target Template: ${template.name}
Language: ${language === 'vi' ? 'Tiếng Việt' : 'English'}

TRANSCRIPT SECTION:
"""
${transcript}
"""

Instructions:
Extract and structure this section into valid JSON Blocks according to ${template.name}.
Include precise timestamps if present in transcript.
Return ONLY raw JSON object.`;
}

/**
 * Prompt Reduce Phase: Hợp nhất các Local Blocks thành 1 Bản Note hoàn chỉnh
 */
export function buildReducePhasePrompt(
  template: TemplateConfig,
  localBlocksSummaries: Array<{ sectionIndex: number; title: string; blockCount: number; summary: string }>,
  language: 'vi' | 'en',
): string {
  const summariesJson = JSON.stringify(localBlocksSummaries, null, 2);

  return `[REDUCE & POLISH PHASE]
Target Template: ${template.name}
Language: ${language === 'vi' ? 'Tiếng Việt' : 'English'}

SECTION SUMMARIES:
${summariesJson}

Instructions:
1. Generate an Executive Overview synthesizing all sections.
2. Generate a Unified Glossary of terms found across all sections.
3. Return meta object: { title, summary, keywords, coreQuestions, globalOverview, glossary: [{ term, definition }] }.
Return ONLY raw JSON object.`;
}

import { z } from 'zod';

export const HeadingBlock = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(1),
});

export const ParagraphBlock = z.object({
  type: z.literal('paragraph'),
  text: z.string().min(1),
});

export const CueBoxBlock = z.object({
  type: z.literal('cue_box'),
  cue: z.string().min(1),
  notes: z.array(z.string()).min(1),
  timestamp: z.number().optional(),
});

export const TableBlock = z.object({
  type: z.literal('table'),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

export const CardGridBlock = z.object({
  type: z.literal('card_grid'),
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
      tag: z.string().optional(),
    }),
  ),
});

export const CalloutBlock = z.object({
  type: z.literal('callout'),
  style: z.union([z.literal('info'), z.literal('warning'), z.literal('tip'), z.literal('danger'), z.literal('success')]),
  title: z.string(),
  text: z.string().min(1),
});

export const MindmapNodeSchema: z.ZodType<{
  label: string;
  children?: any[];
}> = z.lazy(() =>
  z.object({
    label: z.string(),
    children: z.array(MindmapNodeSchema).optional(),
  }),
);

export const MindmapTreeBlock = z.object({
  type: z.literal('mindmap_tree'),
  root: MindmapNodeSchema,
});

export const BlockSchema = z.discriminatedUnion('type', [
  HeadingBlock,
  ParagraphBlock,
  CueBoxBlock,
  TableBlock,
  CardGridBlock,
  CalloutBlock,
  MindmapTreeBlock,
]);

export const NoteMetaSchema = z.object({
  title: z.string().min(1),
  method: z.string(),
  tier: z.string(),
  language: z.union([z.literal('vi'), z.literal('en')]),
  summary: z.string(),
  keywords: z.array(z.string()),
  coreQuestions: z.array(z.string()),
});

export const NoteOutputSchema = z.object({
  meta: NoteMetaSchema,
  blocks: z.array(BlockSchema).min(1),
});

export type Block = z.infer<typeof BlockSchema>;
export type NoteOutput = z.infer<typeof NoteOutputSchema>;

import { NoteOutput } from '@/lib/ai/validators/block-schema';

export type { NoteOutput };

export async function renderToDocx(note: NoteOutput): Promise<Buffer> {
  const docxLib = await import('docx');
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType } = docxLib;

  const children: any[] = [];

  children.push(
    new Paragraph({
      text: note.meta.title,
      heading: HeadingLevel.TITLE,
    }),
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Method: ${note.meta.method.toUpperCase()}  ·  Tier: ${note.meta.tier.toUpperCase()}  ·  Lang: ${note.meta.language}`, italics: true, size: 20 }),
      ],
    }),
  );
  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: '📌 Tóm tắt', heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: note.meta.summary }));
  children.push(new Paragraph({ text: '' }));

  note.blocks.forEach((block) => {
    switch (block.type) {
      case 'heading':
        children.push(
          new Paragraph({
            text: block.text,
            heading: block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          }),
        );
        break;
      case 'paragraph':
        children.push(new Paragraph({ text: block.text }));
        break;
      case 'cue_box':
        children.push(new Paragraph({ children: [new TextRun({ text: `Cue: ${block.cue}`, bold: true })] }));
        block.notes.forEach((n) => children.push(new Paragraph({ text: `• ${n}` })));
        break;
      case 'callout':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `[${block.style.toUpperCase()}] ${block.title}: `, bold: true }), new TextRun({ text: block.text })],
          }),
        );
        break;
      case 'table':
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: block.headers.map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })),
              }),
              ...block.rows.map((row) => new TableRow({ children: row.map((c) => new TableCell({ children: [new Paragraph({ text: c })] })) })),
            ],
          }),
        );
        children.push(new Paragraph({ text: '' }));
        break;
      case 'card_grid':
        block.cards.forEach((c) => {
          children.push(new Paragraph({ children: [new TextRun({ text: `❓ ${c.front}`, bold: true })] }));
          children.push(new Paragraph({ text: `💡 ${c.back}` }));
        });
        break;
      case 'mindmap_tree':
        children.push(new Paragraph({ children: [new TextRun({ text: `Mindmap Root: ${block.root.label}`, bold: true })] }));
        const walk = (node: any, depth: number) => {
          node.children?.forEach((child: any) => {
            children.push(new Paragraph({ text: '  '.repeat(depth) + '↳ ' + child.label }));
            walk(child, depth + 1);
          });
        };
        walk(block.root, 1);
        break;
    }
  });

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

/**
 * Alias để tương thích với code cũ (lib/export/docx được dùng bởi app/api/notes/export).
 */
export async function generateDocxBuffer(note: NoteOutput): Promise<Buffer> {
  return renderToDocx(note);
}

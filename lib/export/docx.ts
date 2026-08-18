import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import { StructuredNoteOutput } from '../ai/gemini';

/**
 * Generate a real Microsoft Word .docx Document buffer from content_structured
 */
export async function generateDocxBuffer(note: StructuredNoteOutput): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: note.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
    })
  );

  // Metadata Block
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Phương pháp: `, bold: true }),
        new TextRun({ text: `${note.method.toUpperCase()}    ` }),
        new TextRun({ text: `Danh mục: `, bold: true }),
        new TextRun({ text: `${note.category}    ` }),
        new TextRun({ text: `Ngày tạo: `, bold: true }),
        new TextRun({ text: `${new Date().toLocaleDateString('vi-VN')}` }),
      ],
      spacing: { after: 300 },
    })
  );

  // Summary Section
  children.push(
    new Paragraph({
      text: '📌 Tóm Tắt Tổng Quan',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 120 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: note.summary, italics: true })],
      spacing: { after: 250 },
    })
  );

  // Keywords
  if (note.keywords && note.keywords.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Từ khóa cốt lõi: ', bold: true }),
          new TextRun({ text: note.keywords.join(' • ') }),
        ],
        spacing: { after: 250 },
      })
    );
  }

  // Core Questions
  if (note.coreQuestions && note.coreQuestions.length > 0) {
    children.push(
      new Paragraph({
        text: '❓ Câu Hỏi Ôn Tập Cốt Lõi',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
      })
    );
    for (const q of note.coreQuestions) {
      children.push(
        new Paragraph({
          text: `• ${q}`,
          spacing: { after: 80 },
        })
      );
    }
  }

  // Method-Specific Layout
  if (note.method === 'cornell') {
    children.push(
      new Paragraph({
        text: '📖 Bố Cục Cornell (Cues & Ghi Chú Chi Tiết)',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    const rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Cột Gợi Ý (Cues / Keywords)', bold: true })],
              }),
            ],
            shading: { fill: 'F3F4F6' },
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Ghi Chú Chi Tiết (Class Notes)', bold: true })],
              }),
            ],
            shading: { fill: 'F3F4F6' },
          }),
        ],
      }),
    ];

    for (const s of note.content.sections) {
      const cueCellContent: Paragraph[] = [
        new Paragraph({
          children: [new TextRun({ text: s.cue || s.title, bold: true })],
          spacing: { after: 100 },
        }),
      ];

      const noteCellContent: Paragraph[] = [
        new Paragraph({
          children: [new TextRun({ text: s.title, bold: true })],
          spacing: { after: 80 },
        }),
      ];

      if (s.definition) {
        noteCellContent.push(
          new Paragraph({
            children: [new TextRun({ text: s.definition, italics: true })],
            spacing: { after: 80 },
          })
        );
      }

      if (s.text) {
        noteCellContent.push(
          new Paragraph({
            text: s.text,
            spacing: { after: 80 },
          })
        );
      }

      if (s.bulletPoints && s.bulletPoints.length > 0) {
        for (const bp of s.bulletPoints) {
          noteCellContent.push(
            new Paragraph({
              text: `• ${bp}`,
              spacing: { after: 40 },
            })
          );
        }
      }

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: cueCellContent,
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: noteCellContent,
            }),
          ],
        })
      );
    }

    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  } else {
    // Standard Outline / Sections
    children.push(
      new Paragraph({
        text: '📖 Nội Dung Chi Tiết',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const s of note.content.sections) {
      children.push(
        new Paragraph({
          text: s.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
        })
      );

      if (s.definition) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Định nghĩa: ${s.definition}`, italics: true })],
            spacing: { after: 80 },
          })
        );
      }

      if (s.text) {
        children.push(
          new Paragraph({
            text: s.text,
            spacing: { after: 100 },
          })
        );
      }

      if (s.bulletPoints && s.bulletPoints.length > 0) {
        for (const bp of s.bulletPoints) {
          children.push(
            new Paragraph({
              text: `• ${bp}`,
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // Summary footer
  if (note.content.summaryText) {
    children.push(
      new Paragraph({
        text: '🎯 Kết Luận & Điểm Cốt Lõi',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 120 },
      })
    );
    children.push(
      new Paragraph({
        text: note.content.summaryText,
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

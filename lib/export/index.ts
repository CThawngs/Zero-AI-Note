import { NoteOutput } from '@/lib/ai/validators/block-schema';
import { renderToMarkdown } from './markdown';
import { renderToStaticHtml } from './static-html';
import { renderToInteractiveHtml } from './interactive-html';
import { renderToDocx } from './docx';
import { renderToPdf } from './pdf';

export type ExportFormat = 'markdown' | 'docx' | 'pdf' | 'static-html' | 'interactive-html' | 'json';

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  mimeType: string;
  data: string | Buffer;
}

export async function exportNote(note: NoteOutput, format: ExportFormat): Promise<ExportResult> {
  const safeFilename = note.meta.title.replace(/[^a-z0-9\u00C0-\u024F\-_]+/gi, '_').substring(0, 50);
  switch (format) {
    case 'markdown':
      return {
        format,
        filename: `${safeFilename}.md`,
        mimeType: 'text/markdown',
        data: renderToMarkdown(note),
      };
    case 'static-html':
      return {
        format,
        filename: `${safeFilename}.html`,
        mimeType: 'text/html',
        data: renderToStaticHtml(note),
      };
    case 'interactive-html':
      return {
        format,
        filename: `${safeFilename}-interactive.html`,
        mimeType: 'text/html',
        data: renderToInteractiveHtml(note),
      };
    case 'docx':
      return {
        format,
        filename: `${safeFilename}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        data: await renderToDocx(note),
      };
    case 'pdf':
      return {
        format,
        filename: `${safeFilename}.pdf`,
        mimeType: 'application/pdf',
        data: await renderToPdf(note),
      };
    case 'json':
      return {
        format,
        filename: `${safeFilename}.json`,
        mimeType: 'application/json',
        data: JSON.stringify(note, null, 2),
      };
  }
}

export { renderToMarkdown, renderToStaticHtml, renderToInteractiveHtml, renderToDocx, renderToPdf };

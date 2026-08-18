import { NextRequest, NextResponse } from 'next/server';
import { generateDocxBuffer } from '@/lib/export/docx';
import { generateHtmlExport, generateInteractiveHtmlExport } from '@/lib/export/html';
import { StructuredNoteOutput } from '@/lib/ai/gemini';
import JSZip from 'jszip';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'docx', formats = [], note } = body as {
      format: 'docx' | 'md' | 'html' | 'interactive-html' | 'pdf' | 'zip';
      formats?: string[];
      note: StructuredNoteOutput;
    };

    if (!note || !note.title) {
      return NextResponse.json({ error: 'Missing note data' }, { status: 400 });
    }

    const safeTitle = (note.title || 'zero-ai-note')
      .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
      .substring(0, 50);

    // ZIP Multi-Export (Ultra exclusive)
    if (format === 'zip' || (Array.isArray(formats) && formats.length > 1)) {
      const zip = new JSZip();
      const targetFormats = formats.length > 0 ? formats : ['docx', 'md', 'html'];

      if (targetFormats.includes('docx')) {
        const docxBuffer = await generateDocxBuffer(note);
        zip.file(`${safeTitle}.docx`, docxBuffer);
      }
      if (targetFormats.includes('md')) {
        const md = note.rawMarkdown || `# ${note.title}\n\n${note.summary}`;
        zip.file(`${safeTitle}.md`, md);
      }
      if (targetFormats.includes('html') || targetFormats.includes('static-html')) {
        const html = generateHtmlExport(note);
        zip.file(`${safeTitle}.html`, html);
      }
      if (targetFormats.includes('interactive-html') || targetFormats.includes('interactive')) {
        const interactiveHtml = generateInteractiveHtmlExport(note);
        zip.file(`${safeTitle}_interactive.html`, interactiveHtml);
      }
      if (targetFormats.includes('pdf')) {
        const printHtml = generateHtmlExport(note);
        zip.file(`${safeTitle}_printable.html`, printHtml);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      return new NextResponse(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${safeTitle}_bundle.zip"`,
        },
      });
    }

    if (format === 'docx') {
      const buffer = await generateDocxBuffer(note);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    if (format === 'interactive-html') {
      const html = generateInteractiveHtmlExport(note);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}_interactive.html"`,
        },
      });
    }

    if (format === 'html' || format === 'pdf') {
      const html = generateHtmlExport(note);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': format === 'html' ? `attachment; filename="${safeTitle}.html"` : 'inline',
        },
      });
    }

    if (format === 'md') {
      const md = note.rawMarkdown || `# ${note.title}\n\n${note.summary}`;
      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}.md"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export file' }, { status: 500 });
  }
}

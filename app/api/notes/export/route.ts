import { NextRequest, NextResponse } from 'next/server';
import { generateDocxBuffer } from '@/lib/export/docx';
import { generateHtmlExport } from '@/lib/export/html';
import { StructuredNoteOutput } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'docx', note } = body as {
      format: 'docx' | 'md' | 'html' | 'pdf';
      note: StructuredNoteOutput;
    };

    if (!note || !note.title) {
      return NextResponse.json({ error: 'Missing note data' }, { status: 400 });
    }

    const safeTitle = (note.title || 'zero-ai-note')
      .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
      .substring(0, 50);

    if (format === 'docx') {
      const buffer = await generateDocxBuffer(note);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
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

import { NextRequest } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { dispatchStructuredNote } from '@/lib/ai/dispatcher';
import { NoteMethod, NoteItem } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('zero_ai_note_session')?.value;
    const session = await verifySession(token ?? '');

    const body = await request.json();
    const {
      prompt,
      method = 'auto',
      language = 'vi',
      model = 'gemini-2.5-flash',
      providerId,
      endpointUrl,
      apiKey,
      sources = [],
    } = body as {
      prompt: string;
      method: NoteMethod;
      language: 'vi' | 'en';
      model: string;
      providerId?: string;
      endpointUrl?: string;
      apiKey?: string;
      sources: { type: 'pdf' | 'youtube' | 'audio' | 'doc' | 'image'; name: string; url?: string }[];
    };

    if (!prompt && (!sources || sources.length === 0)) {
      return fail('Vui lòng nhập nội dung hoặc đính kèm tài liệu để tạo ghi chú.', 400);
    }

    // Combine prompt and source information
    let inputText = prompt || '';
    if (sources && sources.length > 0) {
      inputText += '\n\nTài liệu đính kèm:\n' + sources.map(s => `- [${s.type.toUpperCase()}] ${s.name}`).join('\n');
    }

    // Check user quota if logged in
    let userId: string | null = null;
    if (session) {
      userId = session.sub;
      try {
        const sql = getSql();
        const userRows = await sql`
          select processing_minutes_used, processing_minutes_limit, plan
          from profiles where id = ${session.sub}
        `;
        if (Array.isArray(userRows) && userRows.length > 0) {
          const user = userRows[0] as {
            processing_minutes_used: number;
            processing_minutes_limit: number;
            plan: string;
          };
          if (user.processing_minutes_used >= user.processing_minutes_limit) {
            return fail(
              `Bạn đã dùng hết hạn mức xử lý tháng (${user.processing_minutes_limit} phút). Vui lòng nâng cấp gói Pro hoặc Ultra.`,
              403
            );
          }
        }
      } catch (err) {
        console.warn('Could not verify processing limit from DB:', err);
      }
    }

    // Call Universal Dispatcher (System Gemini Pool or BYOK Provider)
    const generated = await dispatchStructuredNote({
      inputText,
      method,
      language,
      model,
      providerId,
      endpointUrl,
      apiKey,
    });

    const noteId = uuidv4();
    const formattedDate = new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const noteItem: NoteItem = {
      id: noteId,
      title: generated.title,
      summary: generated.summary,
      method: generated.method,
      category: generated.category || (language === 'vi' ? 'Nghiên cứu AI' : 'AI Research'),
      date: formattedDate,
      updatedAt: 'Vừa xong',
      sources: sources || [],
      keywords: generated.keywords || [],
      coreQuestions: generated.coreQuestions || [],
      content: generated.content,
      rawMarkdown: generated.rawMarkdown,
    };

    // Save note to Neon Postgres if user is logged in
    if (userId) {
      try {
        const sql = getSql();
        await sql`
          insert into notes (
            id, user_id, method, output_language, content_structured, created_at
          ) values (
            ${noteId}, ${userId}, ${generated.method}, ${language},
            ${JSON.stringify(generated)}, now()
          )
        `;

        // Increment processing minutes by 1 minute
        await sql`
          update profiles
          set processing_minutes_used = processing_minutes_used + 1
          where id = ${userId}
        `;
      } catch (dbErr) {
        console.warn('Neon DB note save failed, returning in-memory note:', dbErr);
      }
    }

    return ok({
      note: noteItem,
      message: 'Ghi chú học thuật đã được tạo thành công.',
    });
  } catch (error: any) {
    console.error('Note generation failed:', error);
    const message = error?.message || 'Lỗi khi tạo ghi chú AI. Vui lòng thử lại.';
    return fail(message, 500);
  }
}

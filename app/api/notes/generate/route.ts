import { NextRequest } from 'next/server';
import { getSql } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/http';
import { dispatchAgentResponse } from '@/lib/ai/dispatcher';
import { checkNoteLimit } from '@/lib/neon/queries';
import { NoteMethod, NoteItem } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('zero_ai_note_session')?.value;
    const session = await verifySession(token ?? '');

    const body = await request.json();
    const {
      noteId: existingNoteId,
      prompt,
      method = 'auto',
      language = 'vi',
      model = 'gemini-2.5-flash',
      providerId,
      endpointUrl,
      apiKey,
      sources = [],
    } = body as {
      noteId?: string;
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
      return fail('Vui lòng nhập nội dung hoặc đính kèm tài liệu để trò chuyện hoặc tạo ghi chú.', 400);
    }

    // Combine prompt and source information
    let inputText = prompt || '';
    if (sources && sources.length > 0) {
      inputText += '\n\n[Tài liệu đính kèm]:\n' + sources.map(s => `- [${s.type.toUpperCase()}] ${s.name}`).join('\n');
    }

    let userId: string | null = null;
    let userPlan: 'free' | 'pro' | 'ultra' = 'free';
    if (session) {
      userId = session.sub;
      userPlan = (session.plan || 'free') as 'free' | 'pro' | 'ultra';
    }

    // Call Universal Agent Dispatcher
    const agentRes = await dispatchAgentResponse({
      inputText,
      method,
      language,
      model,
      providerId,
      endpointUrl,
      apiKey,
      userPlan,
    });

    // If this was a note creation/update action
    if (agentRes.isNoteAction && agentRes.note) {
      // Check note limit for new notes
      if (session && !existingNoteId) {
        try {
          const limitCheck = await checkNoteLimit(session.sub);
          if (!limitCheck.allowed) {
            return fail(
              limitCheck.message || `Bạn đã đạt giới hạn tối đa ${limitCheck.limit} ghi chú. Vui lòng nâng cấp gói Pro hoặc Ultra.`,
              403
            );
          }
        } catch (err) {
          console.warn('Could not verify note limit from DB:', err);
        }
      }

      const generated = agentRes.note;
      const noteId = existingNoteId || uuidv4();
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

      // Save to Neon DB
      if (userId) {
        try {
          const sql = getSql();
          await sql`
            insert into notes (
              id, user_id, method, output_language, content_structured, updated_at
            ) values (
              ${noteId}, ${userId}, ${generated.method}, ${language},
              ${JSON.stringify(generated)}, now()
            )
            on conflict (id) do update set
              method = ${generated.method},
              output_language = ${language},
              content_structured = ${JSON.stringify(generated)},
              updated_at = now()
          `;

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
        replyText: agentRes.replyText,
        note: noteItem,
        isNoteAction: true,
      });
    }

    // If this was a conversational chat / question / coding / clarification
    return ok({
      replyText: agentRes.replyText,
      note: null,
      isNoteAction: false,
    });
  } catch (error: any) {
    console.error('Agent processing failed:', error);
    const message = error?.message || 'Lỗi khi xử lý yêu cầu AI. Vui lòng thử lại.';
    return fail(message, 500);
  }
}

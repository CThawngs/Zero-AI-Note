import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getNotes,
  getArchivedNotes,
  createNote,
  updateNote,
  archiveNote,
  restoreNote,
  deleteNotePermanently,
  deleteAllArchivedNotes,
  purgeExpiredArchivedNotes,
} from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * GET /api/notes — danh sách notes (hoặc archived nếu ?archived=1).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const archived = request.nextUrl.searchParams.get('archived') === '1';
    const rows = archived
      ? await getArchivedNotes(session.sub)
      : await getNotes(session.sub);
    return NextResponse.json({ notes: rows });
  } catch (err) {
    console.error('[GET /api/notes] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes — tạo note mới.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const note = await createNote({
      user_id: session.sub,
      title: body.title ?? 'Untitled',
      method: body.method ?? 'cornell',
      output_language: body.output_language ?? 'vi',
      content_structured: body.content_structured ?? {},
      confidence_flags: body.confidence_flags ?? {},
    });
    return NextResponse.json({ note });
  } catch (err) {
    console.error('[POST /api/notes] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create note' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notes?id=... — đổi tên note.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    }

    const body = await request.json();
    await updateNote(id, { title: body.title });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/notes] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes:
 * - ?all=1: xoá vĩnh viễn tất cả notes trong thùng rác
 * - ?purgeExpired=1: tự động dọn dẹp các notes quá hạn 30 ngày
 * - ?id=...&permanent=1: xoá vĩnh viễn 1 note cụ thể
 * - ?id=...: chuyển note vào lưu trữ (archive / thùng rác)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (request.nextUrl.searchParams.get('all') === '1') {
      await deleteAllArchivedNotes(session.sub);
      return NextResponse.json({ success: true, message: 'All archived notes deleted permanently' });
    }

    if (request.nextUrl.searchParams.get('purgeExpired') === '1') {
      await purgeExpiredArchivedNotes(session.sub);
      return NextResponse.json({ success: true, message: 'Expired notes purged' });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    }

    if (request.nextUrl.searchParams.get('permanent') === '1') {
      await deleteNotePermanently(id);
    } else {
      await archiveNote(id);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/notes] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete note' },
      { status: 500 }
    );
  }
}

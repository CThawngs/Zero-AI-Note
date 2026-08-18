import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSources, createSource, deleteSource } from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * GET /api/sources — danh sách sources của user.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await getSources(session.sub);
    return NextResponse.json({ sources: rows });
  } catch (err) {
    console.error('[GET /api/sources] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load sources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources — tạo source mới.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const source = await createSource({
      user_id: session.sub,
      type: body.type ?? 'doc',
      file_name: body.file_name ?? 'Tệp không tên',
      size_bytes: body.size_bytes ?? 0,
    });
    return NextResponse.json({ source });
  } catch (err) {
    console.error('[POST /api/sources] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create source' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources?id=... — xoá source.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing source id' }, { status: 400 });
    }

    await deleteSource(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/sources] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete source' },
      { status: 500 }
    );
  }
}

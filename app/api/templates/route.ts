import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getCustomTemplates,
  createCustomTemplate,
  deleteCustomTemplate,
  checkCustomTemplateLimit,
} from '@/lib/neon/queries';

export const runtime = 'nodejs';

/**
 * GET /api/templates — danh sách template do user tự tạo
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await getCustomTemplates(session.sub);
    const limitInfo = await checkCustomTemplateLimit(session.sub);
    return NextResponse.json({ templates, limitInfo });
  } catch (err) {
    console.error('[GET /api/templates] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates — tạo custom template mới (giới hạn: Free ≤ 5, Pro ≤ 25, Ultra ∞)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description_prompt } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên mẫu không được để trống' }, { status: 400 });
    }

    const template = await createCustomTemplate({
      user_id: session.sub,
      name: name.trim(),
      description_prompt: description_prompt?.trim() || '',
    });

    return NextResponse.json({ template });
  } catch (err) {
    console.error('[POST /api/templates] error:', err);
    const isLimit = err instanceof Error && (err.message.includes('giới hạn') || err.message.includes('limit'));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create template', code: isLimit ? 'TEMPLATE_LIMIT_EXCEEDED' : undefined },
      { status: isLimit ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/templates?id=... — xóa custom template
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 });
    }

    await deleteCustomTemplate(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/templates] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete template' },
      { status: 500 }
    );
  }
}

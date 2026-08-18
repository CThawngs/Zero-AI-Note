import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Validate and test AI Provider API Key and Endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { endpointUrl, apiKey, defaultModel, providerId } = body;

    if (!endpointUrl) {
      return NextResponse.json(
        { success: false, error: 'Endpoint URL không được để trống' },
        { status: 400 }
      );
    }

    const cleanEndpoint = endpointUrl.trim().replace(/\/+$/, '');
    const cleanKey = (apiKey || '').trim();
    const model = (defaultModel || 'gpt-4o-mini').trim();

    // 1. Google Gemini Provider
    if (cleanEndpoint.includes('googleapis.com') || providerId === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey || process.env.GEMINI_API_KEY}`;
      const res = await fetch(url, { method: 'GET' });
      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          error: errData?.error?.message || `Google API trả về mã lỗi ${res.status}`,
          latency,
        });
      }
      return NextResponse.json({
        success: true,
        latency,
        message: 'Kết nối Google AI Studio thành công',
      });
    }

    // 2. Anthropic Claude Provider
    if (cleanEndpoint.includes('anthropic.com') || providerId === 'anthropic') {
      const url = `${cleanEndpoint}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          error: errData?.error?.message || `Anthropic API trả về lỗi ${res.status}`,
          latency,
        });
      }
      return NextResponse.json({
        success: true,
        latency,
        message: 'Kết nối Anthropic Claude thành công',
      });
    }

    // 3. OpenAI / OpenRouter / Groq / NVIDIA / Local OpenAI-compatible
    const testUrl = cleanEndpoint.endsWith('/chat/completions')
      ? cleanEndpoint
      : `${cleanEndpoint}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cleanKey) {
      headers['Authorization'] = `Bearer ${cleanKey}`;
    }
    if (cleanEndpoint.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://zero-ai-note.vercel.app';
      headers['X-Title'] = 'Zero AI Note';
    }

    const res = await fetch(testUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });

    const latency = Date.now() - startTime;
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errData?.error?.message || `API endpoint trả về lỗi HTTP ${res.status}`,
        latency,
      });
    }

    return NextResponse.json({
      success: true,
      latency,
      message: 'Kết nối AI Provider thành công',
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[Provider Test Error]:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ endpoint',
      latency,
    });
  }
}

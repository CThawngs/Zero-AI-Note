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

    if (!endpointUrl || !endpointUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'Endpoint URL không được để trống' },
        { status: 400 }
      );
    }

    const cleanEndpoint = endpointUrl.trim().replace(/\/+$/, '');
    const cleanKey = (apiKey || '').trim();
    
    // Auto-resolve default model if omitted by user
    let model = (defaultModel || '').trim();
    if (!model) {
      if (cleanEndpoint.includes('googleapis.com') || providerId === 'google') {
        model = 'gemini-2.0-flash';
      } else if (cleanEndpoint.includes('anthropic.com') || providerId === 'anthropic') {
        model = 'claude-3-5-haiku-20241022';
      } else if (cleanEndpoint.includes('groq.com') || providerId === 'groq') {
        model = 'llama-3.3-70b-versatile';
      } else if (cleanEndpoint.includes('openrouter.ai') || providerId === 'openrouter') {
        model = 'deepseek/deepseek-r1';
      } else if (cleanEndpoint.includes('nvidia.com') || providerId === 'nvidia') {
        model = 'meta/llama-3.1-70b-instruct';
      } else if (cleanEndpoint.includes('localhost') || cleanEndpoint.includes('127.0.0.1') || providerId === 'local') {
        model = 'llama3.3:latest';
      } else {
        model = 'gpt-4o-mini';
      }
    }

    // 1. Google Gemini Provider
    if (cleanEndpoint.includes('googleapis.com') || providerId === 'google') {
      const targetKey = cleanKey || process.env.GEMINI_API_KEY;
      if (!targetKey) {
        return NextResponse.json({
          success: false,
          error: 'Vui lòng nhập Google Gemini API Key để kiểm tra kết nối',
          latency: Date.now() - startTime,
        });
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${targetKey}`;
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
        resolvedModel: model,
        message: 'Kết nối Google AI Studio thành công',
      });
    }

    // 2. Anthropic Claude Provider
    if (cleanEndpoint.includes('anthropic.com') || providerId === 'anthropic') {
      if (!cleanKey) {
        return NextResponse.json({
          success: false,
          error: 'Vui lòng nhập Anthropic API Key (sk-ant-...)',
          latency: Date.now() - startTime,
        });
      }
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
        resolvedModel: model,
        message: 'Kết nối Anthropic Claude thành công',
      });
    }

    // 3. OpenAI / OpenRouter / Groq / NVIDIA / Local / Custom Endpoints
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

    let res = await fetch(testUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });

    let latency = Date.now() - startTime;

    // Fallback: If chat/completions failed, try GET /models endpoint to verify connectivity
    if (!res.ok) {
      try {
        const modelsUrl = cleanEndpoint.replace(/\/chat\/completions$/, '') + '/models';
        const modelsRes = await fetch(modelsUrl, {
          method: 'GET',
          headers: cleanKey ? { Authorization: `Bearer ${cleanKey}` } : {},
        });
        if (modelsRes.ok) {
          return NextResponse.json({
            success: true,
            latency: Date.now() - startTime,
            resolvedModel: model,
            message: 'Kết nối Endpoint thành công qua Models Discovery',
          });
        }
      } catch {}

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
      resolvedModel: model,
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

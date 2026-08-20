import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { getSql } from '@/lib/db';
import { ok, fail } from '@/lib/auth/http';

export const runtime = 'nodejs';

// GET /api/admin/config — Check system health and configurations
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return fail('Forbidden: admin only', 403);
  }

  try {
    const sql = getSql();

    // 1. Check Database connection & latency
    const startDb = Date.now();
    await sql`select 1`;
    const dbLatencyMs = Date.now() - startDb;

    // 2. Check Zero Tracking API status
    const zeroInvoiceApiKey = process.env.ZEROINVOICE_API_KEY || '';
    const ziBase = (await import('@/lib/billing/zeroinvoice')).getZeroInvoiceBaseUrl();
    let zeroInvoiceStatus = 'unknown';
    let zeroInvoiceLatencyMs = 0;
    try {
      const startZi = Date.now();
      const ziRes = await fetch(`${ziBase}/api/bills?limit=1`, {
        headers: {
          'Authorization': `Bearer ${zeroInvoiceApiKey}`,
          'x-api-key': zeroInvoiceApiKey,
        },
      });
      zeroInvoiceLatencyMs = Date.now() - startZi;
      zeroInvoiceStatus = ziRes.ok ? 'connected' : `http_${ziRes.status}`;
    } catch {
      zeroInvoiceStatus = 'unreachable';
    }

    // 3. System Config parameters
    const config = {
      database: {
        status: 'connected',
        latencyMs: dbLatencyMs,
        provider: 'Neon Serverless Postgres',
      },
      zeroInvoice: {
        status: zeroInvoiceStatus,
        latencyMs: zeroInvoiceLatencyMs,
        endpoint: ziBase,
        apiKeyMasked: zeroInvoiceApiKey ? `${zeroInvoiceApiKey.substring(0, 6)}...${zeroInvoiceApiKey.substring(zeroInvoiceApiKey.length - 4)}` : 'Not set',
      },
      gemini: {
        status: process.env.GEMINI_API_KEY ? 'configured' : 'missing_key',
        defaultModel: 'gemini-2.5-flash',
      },
      quotas: {
        notes: { free: 20, pro: 50, ultra: 'unlimited' },
        customTemplates: { free: 5, pro: 25, ultra: 'unlimited' },
        templatesCount: 17,
      }
    };

    return ok({ config });
  } catch (err) {
    console.error('[Admin Config] Error fetching system configuration:', err);
    return fail('Internal server error', 500);
  }
}

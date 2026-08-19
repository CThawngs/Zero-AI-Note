import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { listZeroTrackingPaymentAccounts } from '@/lib/billing/zeroinvoice';

export const runtime = 'nodejs';

/**
 * GET /api/billing/payment-accounts
 *
 * Lists the Zero Tracking payment accounts linked to the app owner, so the
 * checkout screen can render a combobox to switch the receiving account
 * per-checkout (real-time VietQR routing). The Zero Tracking app API key
 * (zi_...) is server-side only — never exposed to the browser.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let accounts: ReturnType<typeof listZeroTrackingPaymentAccounts> extends Promise<infer T> ? T : never;
    try {
      accounts = await listZeroTrackingPaymentAccounts();
    } catch (ztErr) {
      console.error('[payment-accounts] Zero Tracking fetch failed:', ztErr);
      // Fail-open: return empty list so checkout still works with the app default.
      return NextResponse.json({ accounts: [], error: 'Could not load payment accounts' }, { status: 200 });
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[GET /api/billing/payment-accounts] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', accounts: [] },
      { status: 500 }
    );
  }
}

const ZEROINVOICE_API_KEY = process.env.ZEROINVOICE_API_KEY;
const ZEROINVOICE_BASE_URL = process.env.ZEROINVOICE_BASE_URL || 'https://zeroinvoice-silk.vercel.app';

// Fail-closed: nếu thiếu API key → crash rõ ràng, không fallback yếu
if (!ZEROINVOICE_API_KEY) {
  throw new Error(
    'Missing ZEROINVOICE_API_KEY environment variable. ' +
    'Set it in Vercel Environment Variables (and .env.local for local dev). ' +
    'The ZeroInvoice billing integration will not start without it.'
  );
}

export interface ZeroInvoiceBillResponse {
  data: {
    bill_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'expired' | 'failed' | 'resolved';
    /** Zero Tracking trả OBJECT EMVCo fields (xác minh thực tế 2026-08-19) */
    qr_data?: {
      acqId: string;
      amount: number;
      addInfo: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    };
    payment_url: string;
    expires_at: string;
    created_at: string;
  } | null;
  error: string | null;
}

export async function createZeroInvoiceBill(params: {
  amount: number;
  description?: string;
  payment_account_id?: string;
}): Promise<ZeroInvoiceBillResponse> {
  const res = await fetch(`${ZEROINVOICE_BASE_URL}/api/bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZEROINVOICE_API_KEY}`,
      'x-api-key': ZEROINVOICE_API_KEY,
    },
    body: JSON.stringify({
      amount: Math.round(params.amount),
      payment_method: 'VietQR',
      ...(params.payment_account_id ? { payment_account_id: params.payment_account_id } : {}),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ZeroInvoice create bill failed (${res.status}): ${errorText}`);
  }

  const json: ZeroInvoiceBillResponse = await res.json();
  return json;
}

export function getZeroInvoiceBaseUrl(): string {
  return process.env.ZEROINVOICE_BASE_URL || 'https://zeroinvoice-silk.vercel.app';
}

export async function checkZeroInvoiceBillStatus(billId: string): Promise<{
  bill_id: string;
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'resolved';
  amount: number;
}> {
  const res = await fetch(`${getZeroInvoiceBaseUrl()}/api/bills/${billId}`, {
    headers: {
      'Authorization': `Bearer ${ZEROINVOICE_API_KEY}`,
      'x-api-key': ZEROINVOICE_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`ZeroInvoice get bill failed (${res.status})`);
  }

  const json = (await res.json()) as {
    data?: {
      bill?: {
        bill_id: string;
        status: string;
        amount: number;
        paid_at?: string;
      };
      bill_id?: string;
      status?: string;
      amount?: number;
    };
    bill?: { bill_id: string; status: string; amount: number };
    bill_id?: string;
    status?: string;
    amount?: number;
  };

  // Zero Tracking trả GET /api/bills/:id với cấu trúc { data: { bill: {...} } }
  // (đã xác minh thực tế 2026-08-18). Hỗ trợ cả dạng cũ data.bill_id cho tương thích.
  const bill = json.data?.bill || json.data || json.bill || json;

  return {
    bill_id: bill.bill_id || billId,
    status: (bill.status || 'pending') as 'pending' | 'paid' | 'expired' | 'failed' | 'resolved',
    amount: bill.amount || 0,
  };
}

/**
 * List the Zero Tracking payment accounts linked to THIS app's owner.
 * Calls Zero Tracking's partner endpoint with the app API key (zi_...).
 * Returns accounts the user can pick as the per-checkout payee.
 */
export interface ZeroTrackingPaymentAccount {
  id: string;
  type: 'bank' | 'momo' | 'zalopay';
  bank_name: string | null;
  acq_id: string | null;
  account_no: string;
  account_holder: string | null;
  is_verified: boolean;
}

export async function listZeroTrackingPaymentAccounts(): Promise<ZeroTrackingPaymentAccount[]> {
  const res = await fetch(`${getZeroInvoiceBaseUrl()}/api/partner/payment-accounts`, {
    headers: {
      'Authorization': `Bearer ${ZEROINVOICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Zero Tracking list payment accounts failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { data?: { accounts?: ZeroTrackingPaymentAccount[] }; accounts?: ZeroTrackingPaymentAccount[] };
  return (json.data?.accounts || json.accounts || []) as ZeroTrackingPaymentAccount[];
}

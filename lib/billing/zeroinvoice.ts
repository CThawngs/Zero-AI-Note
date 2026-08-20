const ZEROINVOICE_API_KEY = process.env.ZEROINVOICE_API_KEY;

export function getZeroInvoiceBaseUrl(): string {
  let url = process.env.ZEROINVOICE_BASE_URL || process.env.ZERO_TRACKING_BASE_URL || 'https://zeroinvoice-silk.vercel.app';
  if (!url || url.includes('zero-tracking-ai.vercel.app')) {
    url = 'https://zeroinvoice-silk.vercel.app';
  }
  return url.replace(/\/+$/, '');
}

const ZEROINVOICE_BASE_URL = getZeroInvoiceBaseUrl();

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
    status: 'pending' | 'paid' | 'expired' | 'failed' | 'resolved' | 'verifying';
    /** Zero Tracking trả OBJECT EMVCo fields (xác minh thực tế 2026-08-21) */
    qr_data?: {
      acqId: string;
      amount: number;
      addInfo: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    };
    payment_url: string;
    qr_image_url?: string;
    status_url?: string;
    expires_at: string;
    created_at: string;
    payment_account_id?: string;
    payee?: {
      account_no?: string;
      account_holder?: string;
      acq_id?: string;
      bank_name?: string;
      resolved_via?: string;
    };
  } | null;
  error: string | null;
}

export async function createZeroInvoiceBill(params: {
  amount: number;
  description?: string;
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
      description: params.description,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ZeroInvoice create bill failed (${res.status}): ${errorText}`);
  }

  const json: ZeroInvoiceBillResponse = await res.json();
  return json;
}

export async function checkZeroInvoiceBillStatus(billId: string): Promise<{
  bill_id: string;
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'resolved' | 'verifying';
  amount: number;
}> {
  const baseUrl = getZeroInvoiceBaseUrl();

  // Try status-specific endpoint first, fallback to standard bill endpoint
  let res = await fetch(`${baseUrl}/api/bills/${billId}/status`, {
    headers: {
      'Authorization': `Bearer ${ZEROINVOICE_API_KEY}`,
      'x-api-key': ZEROINVOICE_API_KEY || '',
    },
    cache: 'no-store',
  }).catch(() => null);

  if (!res || !res.ok) {
    res = await fetch(`${baseUrl}/api/bills/${billId}`, {
      headers: {
        'Authorization': `Bearer ${ZEROINVOICE_API_KEY}`,
        'x-api-key': ZEROINVOICE_API_KEY || '',
      },
      cache: 'no-store',
    });
  }

  if (!res.ok) {
    throw new Error(`ZeroInvoice get bill status failed (${res.status})`);
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
  // và GET /api/bills/:id/status với { data: { status, is_paid } }
  const bill = json.data?.bill || json.data || json.bill || json;

  return {
    bill_id: bill.bill_id || billId,
    status: (bill.status || 'pending') as 'pending' | 'paid' | 'expired' | 'failed' | 'resolved' | 'verifying',
    amount: bill.amount || 0,
  };
}

const ZEROINVOICE_API_KEY = process.env.ZEROINVOICE_API_KEY || 'zi_17762c7f1f650f2833f268e692573e5fa5e250b29b7a82de';
const ZEROINVOICE_BASE_URL = process.env.ZEROINVOICE_BASE_URL || 'https://zeroinvoice-silk.vercel.app';

export interface ZeroInvoiceBillResponse {
  data: {
    bill_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'expired' | 'failed' | 'resolved';
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
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'resolved';
  amount: number;
}> {
  const res = await fetch(`${ZEROINVOICE_BASE_URL}/api/bills/${billId}`, {
    headers: {
      'Authorization': `Bearer ${ZEROINVOICE_API_KEY}`,
      'x-api-key': ZEROINVOICE_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`ZeroInvoice get bill failed (${res.status})`);
  }

  const json = await res.json();
  const bill = json.data || json.bill || json;
  return {
    bill_id: bill.bill_id || bill.id || billId,
    status: bill.status || 'pending',
    amount: bill.amount || 0,
  };
}

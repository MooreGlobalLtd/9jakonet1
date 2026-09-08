import type { VercelRequest, VercelResponse } from '@vercel/node';

const NIGERIAN_BANKS_FALLBACK = [
  { name: 'Access Bank', code: '044' },
  { name: 'Guaranty Trust Bank (GTB)', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Polaris Bank', code: '076' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(200).json({ success: true, banks: NIGERIAN_BANKS_FALLBACK, source: 'fallback' });
    }

    const response = await fetch('https://api.paystack.co/bank', {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    const data = await response.json();
    if (data.status && data.data) {
      return res.status(200).json({ success: true, banks: data.data, source: 'paystack' });
    } else {
      return res.status(200).json({ success: true, banks: NIGERIAN_BANKS_FALLBACK, source: 'fallback' });
    }
  } catch (error) {
    console.error('Failed to fetch banks:', error);
    return res.status(200).json({ success: true, banks: NIGERIAN_BANKS_FALLBACK, source: 'fallback' });
  }
}

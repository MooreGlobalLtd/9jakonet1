import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accountNumber, bankCode } = req.body || {};
  if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
    return res.status(400).json({ success: false, error: 'Invalid account number or bank code' });
  }

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'PAYSTACK_SECRET_KEY is not configured on the server environment variables.' 
      });
    }

    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    const data = await response.json();

    if (data.status && data.data) {
      return res.status(200).json({ success: true, accountName: data.data.account_name });
    } else {
      return res.status(400).json({ success: false, error: data.message || 'Could not verify account number. Please check account number and bank.' });
    }
  } catch (error) {
    console.error('Bank account resolution error:', error);
    return res.status(500).json({ success: false, error: 'Failed to connect to payment gateway for account verification.' });
  }
}

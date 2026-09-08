import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Paystack-Secret-Key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const headerKey = req.headers['x-paystack-secret-key'] as string;
  const queryKey = req.query?.secretKey as string;
  const bodyKey = req.body?.secretKey as string;
  const secretKey = (headerKey && headerKey.trim()) || 
                    (queryKey && queryKey.trim()) || 
                    (bodyKey && bodyKey.trim()) || 
                    (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.trim()) || 
                    '';

  if (!secretKey) {
    return res.status(400).json({ 
      success: false, 
      error: 'Paystack secret key is not provided. Please enter it in the Admin Settings.' 
    });
  }

  try {
    const response = await fetch('https://api.paystack.co/balance', {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    const data = await response.json();
    if (data.status && data.data) {
      return res.status(200).json({ success: true, balances: data.data });
    } else {
      return res.status(400).json({ success: false, error: data.message || 'Failed to fetch Paystack balance' });
    }
  } catch (error: any) {
    console.error('Failed to fetch balance:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Error connecting to Paystack balance API' });
  }
}

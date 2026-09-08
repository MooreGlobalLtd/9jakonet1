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
  const bodyKey = req.body?.secretKey as string;
  const secretKey = (headerKey && headerKey.trim()) || 
                    (bodyKey && bodyKey.trim()) || 
                    (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.trim()) || 
                    '';

  if (!secretKey) {
    return res.status(400).json({ success: false, error: 'Paystack secret key is missing' });
  }

  try {
    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (data.status && data.data) {
      return res.status(200).json({ success: true, recipient_code: data.data.recipient_code, data: data.data });
    } else {
      return res.status(400).json({ success: false, error: data.message || 'Failed to create transfer recipient' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Server error creating recipient' });
  }
}

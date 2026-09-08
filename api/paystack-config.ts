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

  if (req.method === 'POST') {
    const { publicKey, secretKey } = req.body || {};
    return res.status(200).json({
      success: true,
      message: 'Paystack configuration received successfully',
      publicKey: publicKey || process.env.PAYSTACK_PUBLIC_KEY || '',
      isConfigured: Boolean(secretKey || process.env.PAYSTACK_SECRET_KEY)
    });
  }

  const envPublic = process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_04b9016335193910cdba3828c46002496a7ef412';
  const envSecret = process.env.PAYSTACK_SECRET_KEY || '';
  const headerKey = req.headers['x-paystack-secret-key'] as string;
  const activeSecret = (headerKey && headerKey.trim()) || envSecret;

  return res.status(200).json({
    success: true,
    publicKey: envPublic,
    isConfigured: Boolean(activeSecret),
    secretKeyMasked: activeSecret ? `${activeSecret.slice(0, 7)}...${activeSecret.slice(-4)}` : ''
  });
}

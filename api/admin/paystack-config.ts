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

  const { publicKey, secretKey } = req.body || {};
  return res.status(200).json({
    success: true,
    message: 'Paystack configuration saved successfully',
    publicKey: publicKey || process.env.PAYSTACK_PUBLIC_KEY || '',
    isConfigured: Boolean(secretKey || process.env.PAYSTACK_SECRET_KEY)
  });
}

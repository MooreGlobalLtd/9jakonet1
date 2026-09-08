import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS headers
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accountNumber, bankCode, accountName, amount, reason, secretKey: bodySecretKey } = req.body || {};
  
  if (!accountNumber || !bankCode || !amount || Number(amount) <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required payout fields (accountNumber, bankCode, amount).' 
    });
  }

  const headerKey = req.headers['x-paystack-secret-key'] as string;
  const secretKey = (headerKey && headerKey.trim()) || 
                    (bodySecretKey && bodySecretKey.trim()) || 
                    (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.trim()) || 
                    '';

  if (!secretKey) {
    return res.status(400).json({ 
      success: false, 
      error: 'Paystack secret key is not configured on the server or provided in admin settings.' 
    });
  }

  try {
    // 1. Create or resolve transfer recipient
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName || 'Artisan Partner',
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      })
    });
    const recipientData = await recipientRes.json();
    if (!recipientData.status || !recipientData.data?.recipient_code) {
      return res.status(400).json({ 
        success: false, 
        error: recipientData.message || 'Failed to create transfer recipient on Paystack.' 
      });
    }

    const recipientCode = recipientData.data.recipient_code;

    // 2. Initiate Transfer (amount in kobo)
    const amountInKobo = Math.round(Number(amount) * 100);
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountInKobo,
        recipient: recipientCode,
        reason: reason || '9jaKonet Artisan Payout'
      })
    });
    const transferData = await transferRes.json();

    if (transferData.status && transferData.data) {
      return res.status(200).json({
        success: true,
        transferCode: transferData.data.transfer_code,
        reference: transferData.data.reference,
        status: transferData.data.status,
        amount: Number(amount)
      });
    } else {
      return res.status(400).json({
        success: false,
        error: transferData.message || 'Failed to initiate transfer on Paystack. Check Paystack balance or disable Transfers OTP in settings.'
      });
    }
  } catch (error: any) {
    console.error('Paystack payout error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Server error initiating payout via Paystack.' 
    });
  }
}

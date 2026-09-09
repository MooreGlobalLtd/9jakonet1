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
    const [balanceRes, totalsRes] = await Promise.all([
      fetch('https://api.paystack.co/balance', {
        headers: { Authorization: `Bearer ${secretKey}` }
      }),
      fetch('https://api.paystack.co/transaction/totals', {
        headers: { Authorization: `Bearer ${secretKey}` }
      })
    ]);

    const balanceData = await balanceRes.json();
    let totalsData: any = null;
    try {
      totalsData = await totalsRes.json();
    } catch {
      // ignore
    }

    let transferBalanceNGN = 0;
    if (balanceData.status && Array.isArray(balanceData.data)) {
      const ngn = balanceData.data.find((b: any) => b.currency === 'NGN');
      if (ngn) {
        transferBalanceNGN = Number(ngn.balance || 0) / 100;
      }
    }

    let totalRevenueNGN = 0;
    let totalTransactions = 0;
    if (totalsData && totalsData.status && totalsData.data) {
      totalTransactions = totalsData.data.total_transactions || 0;
      if (Array.isArray(totalsData.data.total_volume_by_currency)) {
        const ngn = totalsData.data.total_volume_by_currency.find((c: any) => c.currency === 'NGN');
        if (ngn) {
          totalRevenueNGN = Number(ngn.amount || 0) / 100;
        }
      } else if (totalsData.data.total_volume) {
        totalRevenueNGN = Number(totalsData.data.total_volume || 0) / 100;
      }
    }

    return res.status(200).json({ 
      success: true, 
      balances: balanceData.data || [],
      transferBalance: transferBalanceNGN,
      totalRevenue: totalRevenueNGN,
      totalTransactions
    });
  } catch (error: any) {
    console.error('Failed to fetch balance:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Error connecting to Paystack balance API' });
  }
}

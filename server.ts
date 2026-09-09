import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';

// Local Paystack Config Persistence
const CONFIG_FILE = path.join(process.cwd(), 'paystack-config.json');
let paystackConfig = { publicKey: '', secretKey: '' };

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    paystackConfig = JSON.parse(raw);
  }
} catch (e) {
  console.error('Failed to load paystack-config.json:', e);
}

function getPaystackSecretKey(req?: express.Request): string {
  const headerKey = req?.headers['x-paystack-secret-key'] as string;
  if (headerKey && headerKey.trim()) return headerKey.trim();
  const bodyKey = req?.body?.secretKey as string;
  if (bodyKey && bodyKey.trim()) return bodyKey.trim();
  const queryKey = req?.query?.secretKey as string;
  if (queryKey && queryKey.trim()) return queryKey.trim();
  if (paystackConfig.secretKey && paystackConfig.secretKey.trim()) return paystackConfig.secretKey.trim();
  if (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.trim()) return process.env.PAYSTACK_SECRET_KEY.trim();
  return '';
}

function getPaystackPublicKey(): string {
  if (paystackConfig.publicKey && paystackConfig.publicKey.trim()) return paystackConfig.publicKey.trim();
  if (process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_PUBLIC_KEY.trim()) return process.env.PAYSTACK_PUBLIC_KEY.trim();
  return 'pk_live_04b9016335193910cdba3828c46002496a7ef412';
}

// Lazy initialize Resend to avoid crashing if the API key is missing
let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email API Route
  app.post('/api/emails/send', async (req, res) => {
    const { to, subject, html } = req.body;
    
    const resend = getResend();
    if (!resend) {
      console.warn('RESEND_API_KEY is not set. Simulating email send:', { to, subject });
      return res.json({ 
        success: true, 
        message: 'Simulated email sent (API key missing)',
        simulated: true 
      });
    }

    try {
      const data = await resend.emails.send({
        from: '9jaKonet <hello@9jakonet.mooregloballtd.online>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      });

      res.json({ success: true, data });
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  });

  // Paystack Configuration Endpoints
  app.get('/api/paystack-config', (req, res) => {
    const secret = getPaystackSecretKey(req);
    res.json({
      success: true,
      publicKey: getPaystackPublicKey(),
      isConfigured: Boolean(secret),
      secretKeyMasked: secret ? `${secret.slice(0, 7)}...${secret.slice(-4)}` : ''
    });
  });

  const handleSaveConfig = (req: express.Request, res: express.Response) => {
    const { publicKey, secretKey } = req.body;
    if (publicKey) paystackConfig.publicKey = publicKey.trim();
    if (secretKey) paystackConfig.secretKey = secretKey.trim();

    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(paystackConfig, null, 2), 'utf-8');
      res.json({ 
        success: true, 
        message: 'Paystack configuration saved successfully on server!',
        publicKey: getPaystackPublicKey(),
        isConfigured: Boolean(getPaystackSecretKey())
      });
    } catch (error) {
      console.error('Failed to write paystack-config.json:', error);
      res.status(500).json({ success: false, error: 'Failed to persist Paystack configuration.' });
    }
  };

  app.post('/api/admin/paystack-config', handleSaveConfig);
  app.post('/api/paystack-config', handleSaveConfig);

  // Check Paystack Live Balance
  app.get('/api/paystack-balance', async (req, res) => {
    const secretKey = getPaystackSecretKey(req);
    if (!secretKey) {
      return res.status(400).json({ success: false, error: 'Paystack secret key is not configured.' });
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

      res.json({
        success: true,
        balances: balanceData.data || [],
        transferBalance: transferBalanceNGN,
        totalRevenue: totalRevenueNGN,
        totalTransactions
      });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      res.status(500).json({ success: false, error: 'Error connecting to Paystack balance API' });
    }
  });

  // Paystack Bank List & Account Resolution API
  const NIGERIAN_BANKS_FALLBACK = [
    { name: 'Access Bank', code: '044' },
    { name: 'Guaranty Trust Bank (GTB)', code: '058' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'United Bank for Africa (UBA)', code: '033' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'Kuda Bank', code: '090267' },
    { name: 'OPay', code: '999992' },
    { name: 'PalmPay', code: '999991' },
    { name: 'Moniepoint MFB', code: '090405' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Polaris Bank', code: '076' },
  ];

  app.get('/api/banks', async (req, res) => {
    try {
      const secretKey = getPaystackSecretKey(req);
      if (!secretKey) {
        return res.json({ success: true, banks: NIGERIAN_BANKS_FALLBACK, source: 'fallback' });
      }

      const response = await fetch('https://api.paystack.co/bank', {
        headers: { Authorization: `Bearer ${secretKey}` }
      });
      const data = await response.json();
      if (data.status && data.data) {
        res.json({ success: true, banks: data.data, source: 'paystack' });
      } else {
        res.json({ success: true, banks: NIGERIAN_BANKS_FALLBACK, source: 'fallback' });
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      res.json({ success: true, banks: NIGERIAN_BANKS_FALLBACK, source: 'fallback' });
    }
  });

  app.post('/api/resolve-account', async (req, res) => {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      return res.status(400).json({ success: false, error: 'Invalid account number or bank code' });
    }

    try {
      const secretKey = getPaystackSecretKey(req);
      if (!secretKey) {
        return res.status(400).json({ 
          success: false, 
          error: 'PAYSTACK_SECRET_KEY is not configured on server or admin settings.' 
        });
      }

      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
      });
      const data = await response.json();

      if (data.status && data.data) {
        return res.json({ success: true, accountName: data.data.account_name });
      } else {
        return res.status(400).json({ success: false, error: data.message || 'Could not verify account number. Please check account number and bank.' });
      }
    } catch (error) {
      console.error('Bank account resolution error:', error);
      return res.status(500).json({ success: false, error: 'Failed to connect to payment gateway for account verification.' });
    }
  });

  // Unified Atomic Payout API (Creates recipient + initiates transfer in one go)
  app.post('/api/payout', async (req, res) => {
    const { accountNumber, bankCode, accountName, amount, reason } = req.body;
    
    if (!accountNumber || !bankCode || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Missing required payout fields (accountNumber, bankCode, amount).' });
    }

    const secretKey = getPaystackSecretKey(req);
    if (!secretKey) {
      return res.status(400).json({ success: false, error: 'PAYSTACK_SECRET_KEY is not configured on the platform.' });
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

      // 2. Initiate Transfer (amount converted to kobo)
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
        return res.json({
          success: true,
          transferCode: transferData.data.transfer_code,
          reference: transferData.data.reference,
          status: transferData.data.status,
          amount: Number(amount),
          message: transferData.message || 'Transfer queued successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: transferData.message || 'Paystack declined the transfer request.'
        });
      }
    } catch (error) {
      console.error('Payout execution error:', error);
      res.status(500).json({ success: false, error: 'Internal server error while executing Paystack transfer.' });
    }
  });

  // Paystack Transfer Recipient API (Low level)
  app.post('/api/transferrecipient', async (req, res) => {
    const { type = 'nuban', name, account_number, bank_code, currency = 'NGN' } = req.body;
    const secretKey = getPaystackSecretKey(req);
    if (!secretKey) {
      return res.status(400).json({ success: false, error: 'PAYSTACK_SECRET_KEY is not configured on server or admin settings.' });
    }
    try {
      const response = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, name, account_number, bank_code, currency })
      });
      const data = await response.json();
      if (data.status && data.data) {
        res.json({ success: true, recipient_code: data.data.recipient_code, data: data.data });
      } else {
        res.status(400).json({ success: false, error: data.message || 'Failed to create transfer recipient' });
      }
    } catch (error) {
      console.error('Transfer recipient error:', error);
      res.status(500).json({ success: false, error: 'Failed to connect to Paystack Transfer API' });
    }
  });

  // Paystack Transfer API (Instant Payout)
  app.post('/api/transfer', async (req, res) => {
    const { source = 'balance', amount, recipient, reason } = req.body;
    const secretKey = getPaystackSecretKey(req);
    if (!secretKey) {
      return res.status(400).json({ success: false, error: 'PAYSTACK_SECRET_KEY is not configured on server or admin settings.' });
    }
    try {
      const response = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source, amount, recipient, reason })
      });
      const data = await response.json();
      if (data.status && data.data) {
        res.json({ success: true, transfer_code: data.data.transfer_code, status: data.data.status, data: data.data });
      } else {
        res.status(400).json({ success: false, error: data.message || 'Failed to initiate transfer' });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ success: false, error: 'Failed to connect to Paystack Transfer API' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

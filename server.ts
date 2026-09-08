import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';

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
      // NOTE: Resend requires a verified domain to send emails.
      // Once verified, replace 'onboarding@resend.dev' with something like 'hello@mooregloballtd.online'
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
    { name: 'Fidelity Bank', code: '070' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Polaris Bank', code: '076' },
  ];

  app.get('/api/banks', async (req, res) => {
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
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
        return res.json({ success: true, accountName: data.data.account_name });
      } else {
        return res.status(400).json({ success: false, error: data.message || 'Could not verify account number. Please check account number and bank.' });
      }
    } catch (error) {
      console.error('Bank account resolution error:', error);
      return res.status(500).json({ success: false, error: 'Failed to connect to payment gateway for account verification.' });
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

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import { GoogleGenAI } from '@google/genai';

// Lazy initialize Gemini to avoid crashing if the API key is missing
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

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
        from: '9jaKonet <info@mooregloballtd.online>',
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

  // KonetBot AI Assistant Endpoint (Strictly 9jaKonet-scoped)
  const KONETBOT_SYSTEM_INSTRUCTION = `You are KonetBot, the active and dedicated AI Support Assistant and Concierge for 9jaKonet (https://9jakonet.ng), Nigeria's premier digital marketplace connecting verified artisans with customers.

YOUR ROLE & TONE:
- You speak naturally, warmly, empathetically, and conversationally, like a knowledgeable, professional human support specialist.
- You are helpful, polite, and articulate with a welcoming Nigerian customer-care touch.
- You provide clear, step-by-step guidance when explaining platform processes.

STRICT BOUNDARY & EXCLUSIVITY RULE:
- YOU MUST ONLY ANSWER QUESTIONS CONCERNING THE 9JAKONET WEB APPLICATION, ITS FEATURES, SERVICES, POLICIES, AND WORKFLOWS.
- YOU ARE STRICTLY FORBIDDEN FROM ANSWERING QUESTIONS OUTSIDE OF 9JAKONET (such as general programming, sports, news, world history, politics, unrelated apps/companies, recipes, homework, mathematics, entertainment, etc.).
- IF A USER ASKS ABOUT ANYTHING OUTSIDE 9JAKONET:
  Politely and warmly decline. For example: "I am KonetBot, your dedicated 9jaKonet support concierge! I only answer questions related to the 9jaKonet platform, such as hiring verified artisans, Paystack escrow protection, artisan registration, job contracts, and wallet withdrawals. How can I help you with 9jaKonet today?"

9JAKONET PLATFORM KNOWLEDGE BASE:
1. What is 9jaKonet?
   - Nigeria's #1 trusted marketplace connecting customers with verified local artisans (Electricians, Plumbers, Carpenters, AC Technicians, Painters, Tilers, Welders, Mechanics, Solar Installers, etc.) across all 36 Nigerian states and Abuja.

2. Paystack Escrow & Payment Protection:
   - How It Works:
     1. Customer books an artisan or posts a job.
     2. Customer funds the agreed contract amount securely via Paystack into 9jaKonet Escrow. Funds are safely held by 9jaKonet and are NOT given to the artisan upfront.
     3. Artisan does and completes the work.
     4. Dual-Verification OTP Release: Customer inspects the work. If satisfied, customer clicks "Release Funds" on their Jobs & Escrow dashboard. A 6-digit authorization code is instantly sent to the customer's registered email. Customer enters this code to authorize the release.
     5. Commission & Payout: 9jaKonet retains a 10% platform commission for escrow security and insurance. The remaining 90% is instantly credited to the artisan's payout wallet.

3. Wallet & Bank Withdrawals:
   - Artisans can withdraw funds from their wallet directly into any registered Nigerian bank account (GTBank, Access Bank, Zenith, First Bank, UBA, OPay, PalmPay, Kuda, Moniepoint, etc.).
   - All transactions and withdrawals feature exact Nigerian Date & Time timestamps.

4. Artisan Verification:
   - Artisans submit government ID (NIN, Driver's License, Voter's Card, or Passport), trade certificates, years of experience, and phone verification.
   - 9jaKonet admins vet and approve the profile, granting a green "Verified" badge.

5. Safety & Disputes:
   - If work is substandard or incomplete, customers should NOT release the escrow funds. They can click "Raise Dispute" or contact admin support. 9jaKonet mediates disputes fairly and can issue a refund or require rework.
   - Never pay an artisan cash or off-platform. Off-platform payments void all escrow protection.

6. User Roles:
   - Customers: Search, hire, chat, fund escrow, release payment with OTP, review artisans.
   - Artisans: Create profile, get verified, receive job invites, deliver services, receive 90% payouts, withdraw to bank.
   - Admins: Manage verifications, oversee escrow ledger, review withdrawals, and mediate disputes.

7. Live GPS Location & Field Safety (Active 9jaKonet Feature):
   - To safeguard Nigerian households and artisans during home or office visits, 9jaKonet requires live location/GPS confirmation for active safety and emergency traceability.
   - If a user asks how to turn on location or GPS on their phone for 9jaKonet:
     * Android: Swipe down Quick Settings from the top of the phone screen and tap Location (📍) to turn it ON. In browser (Chrome), tap the Lock (🔒) icon beside 9jakonet.ng ➔ Permissions ➔ Location ➔ Allow.
     * iPhone (Safari): Open iPhone Settings ➔ Privacy & Security ➔ Location Services ➔ Turn ON. In Safari, tap 'aA' in the address bar ➔ Website Settings ➔ Location ➔ Allow.
     * Explain that their location is encrypted and strictly used to verify job arrival and emergency safety.`;

  function getFallbackBotReply(userPrompt: string): string {
    const q = userPrompt.toLowerCase().trim();

    // 1. Trades and Local Services across Nigeria (Lagos, Abuja, PH, etc.)
    if (/plumber|plumbing|pipe|leak|tap|water heater|sink/.test(q)) {
      return "### Verified Plumbers on 9jaKonet 🔧\n\nYes! You can find vetted, experienced plumbers on 9jaKonet across **Lagos (Ikeja, Lekki, Yaba, Surulere, etc.), Abuja, Port Harcourt, Ibadan**, and all 36 states.\n\n- **Services**: Pipe repairs, bathroom installations, borehole plumbing, water pump fixing, drainage, and leak fixes.\n- **How to Hire**: Go to **Explore** ➜ filter by Trade (**Plumbing**) and your State ➜ inspect verified reviews and ratings ➜ message the plumber or click **Hire** to fund the Paystack escrow safely.\n- **Protection**: Your money stays locked in escrow until the plumbing work is tested and approved by you!";
    }

    if (/electrician|electrical|wiring|light|fuse|inverter|solar|generator/.test(q)) {
      return "### Certified Electricians & Solar Technicians ⚡\n\n9jaKonet connects you with licensed electricians and solar/inverter installers across Nigeria:\n\n- **Services**: House wiring, circuit breaker fixing, solar panel mounting, hybrid inverter setup, distribution board troubleshooting, and soundproof generator maintenance.\n- **Safety Vetted**: All certified technicians submit their trade credentials and government ID.\n- **Escrow Guarantee**: Payment is secured via Paystack and only released via your 6-digit email OTP after electrical testing is complete.";
    }

    if (/carpenter|furniture|cabinet|roofing|wood|wardrobe|bed frame/.test(q)) {
      return "### Master Carpenters & Furniture Makers 🪚\n\nLooking for skilled woodwork? On 9jaKonet, you can hire verified carpenters for:\n\n- Custom kitchen cabinets, modern wardrobes, bed frames, doors, and roofing repairs.\n- Quality wood finishing, polishing, and lock installations.\n- Filter by your local government area (LGA) on the **Explore** page and inspect completed portfolio photos.";
    }

    if (/ac|air condition|refrigerator|fridge|cooling|chiller/.test(q)) {
      return "### AC Technicians & Refrigeration Specialists ❄️\n\nGet rapid, professional air conditioning and cooling repairs:\n\n- Gas refilling (R22 / R410), compressor replacement, uninstallation/mounting, leak detection, and servicing.\n- Transparent hourly or flat service rates visible directly on each technician's profile.";
    }

    if (/mechanic|auto|car repair|brake|engine|panel beater|vulcanizer/.test(q)) {
      return "### Auto Mechanics & Vehicle Diagnostics 🚗\n\nFind experienced automobile mechanics, auto-electricians, and diagnostic specialists near you. Book with confidence under 9jaKonet Escrow so you never pay upfront for unverified parts or shoddy repairs.";
    }

    if (/paint|tiler|welder|mason|clean|masonry|welding|iron/.test(q)) {
      return "### Verified Artisans on 9jaKonet 🛠️\n\nWe feature verified Nigerian artisans across all core trades:\n\n- **Painters**: Interior/exterior emulsion, screeding, texturing, wallpapering.\n- **Tilers**: Floor tiling, porcelain, marble, and wall tiles.\n- **Welders**: Security gates, window burgles, iron railings, and fabrication.\n- **Cleaners**: Post-construction deep cleaning, home fumigation, and office sanitization.\n\nBrowse profiles on the **Explore** tab to compare verified badges and ratings!";
    }

    // 2. KYC, Verification & Identity
    if (/kyc|nin|identity|voter|driver'?s license|passport|document|how to verify|verification process|verification take|get verified/.test(q)) {
      return "### Mandatory Identity Verification (KYC) on 9jaKonet 🛡️\n\nTo ensure 100% safety for every Nigerian household, 9jaKonet enforces mandatory verification:\n\n1. **Personal Details**: Your full legal name, phone number, and residential address.\n2. **Official Nigerian Document**: Provide your NIN (National Identification Number), Voter's Card, Driver's License, or International Passport with a clear photo.\n3. **Live Biometric Selfie**: Captured in real-time with anti-spoofing to match your submitted document.\n4. **Active GPS Traceability**: Confirms your operating area for field safety.\n\n- **Processing Time**: Verifications are reviewed swiftly. Verified users receive the prestigious green **Verified Badge**, unlocking instant client trust!";
    }

    // 3. Live Location, Phone GPS & Settings Toggle
    if (/location|gps|phone location|toggle|turn on location|trace|map/.test(q)) {
      return "### Live GPS Location & Phone Activation 📍\n\n**Why Live Location is Required:**\nWhen artisans visit customer homes or offices, active GPS coordinates provide emergency traceability and verify on-site arrival. Your location is encrypted and strictly used for safety.\n\n**How to Turn On Location on Your Phone:**\n\n- **On Android Phones (Samsung, Tecno, Infinix, Xiaomi, etc.)**:\n  1. Swipe down from the top of your screen to open the **Quick Settings** panel.\n  2. Tap the **Location** (📍) icon to switch it ON (turns blue/active).\n  3. At the top of your browser (beside 9jakonet.ng), tap the **Lock (🔒) or Settings icon** ➜ **Site Settings / Permissions** ➜ **Location** ➜ Choose **Allow**.\n\n- **On iPhones (Apple Safari)**:\n  1. Open iPhone **Settings** ➜ **Privacy & Security** ➜ **Location Services** ➜ Turn ON.\n  2. In Safari, tap the **'aA'** icon in the address bar ➜ **Website Settings** ➜ **Location** ➜ Select **Allow**.\n\nOnce turned on, tap **'Re-detect GPS'** on 9jaKonet!";
    }

    // 4. Paystack Escrow & Payment Security
    if (/escrow|paystack|how does payment work|fund|pay artisan|is my money safe|payment safety/.test(q)) {
      return "### How Paystack Escrow Works on 9jaKonet 🔒\n\n1. **Fund Contract**: When hiring an artisan or posting a job, you fund the agreed budget via Paystack (Debit Card, Bank Transfer, USSD).\n2. **Funds Held in Trust**: Your payment is safely held by 9jaKonet in Escrow — the artisan does **NOT** get paid upfront.\n3. **Job Delivery**: The artisan completes the agreed work to your standards.\n4. **Dual-Verification OTP Release**: When you click **Release Funds**, a **6-digit authorization code** is sent to your registered email. Enter this code to finalize payment.\n5. **90/10 Split**: 90% is credited directly to the artisan's wallet, and 10% is retained as 9jaKonet platform commission.\n\n*Never pay cash or transfer money off-platform! Off-platform payments void all dispute and escrow protection.*";
    }

    // 5. 6-Digit Email OTP Release Code
    if (/otp|release code|authorization code|6-digit|email code|release money|didn't get otp|did not receive/.test(q)) {
      return "### 6-Digit Email Authorization Code (OTP) ✉️\n\nWhen a customer clicks **'Release Funds'** on their Jobs dashboard:\n\n- A unique **6-digit security code** is instantly dispatched to your registered email address.\n- This prevents unauthorized payouts or accidental clicks.\n- Enter the code in the confirmation modal to release the 90% net payout to the artisan.\n- **Tip**: Check your spam/junk folder if not seen immediately, or use the instant preview helper code during test mode.";
    }

    // 6. Fees, Commissions & Payout Split
    if (/fee|commission|10%|90%|cut|charges|percentage|platform fee/.test(q)) {
      return "### 9jaKonet Transparent Fee Structure 💼\n\n- **10% Platform Commission**: Retained by 9jaKonet upon successful job completion. This covers Paystack payment processing, escrow dispute insurance, artisan background vetting, and customer care.\n- **90% Artisan Net Payout**: The artisan receives 90% of the contract amount directly into their withdrawal wallet.\n- **Free Sign-up**: Registering, posting jobs, and searching verified artisans is 100% free!";
    }

    // 7. Withdrawals & Bank Accounts
    if (/withdraw|bank|payout|wallet|transfer to bank|gtbank|zenith|opay|palmpay|kuda|moniepoint/.test(q)) {
      return "### How Artisans Withdraw to Nigerian Banks 🏦\n\n1. Navigate to the **Wallet** tab.\n2. Add your **NUBAN Bank Account** (All major banks supported: GTBank, Zenith, Access, First Bank, UBA, Kuda, OPay, PalmPay, Moniepoint, etc.).\n3. The system automatically verifies your official account name.\n4. Enter your withdrawal amount from available balance and click **Request Withdrawal**.\n5. Payouts are executed via Paystack with official Nigerian Date & Time timestamps logged in your ledger.";
    }

    // 8. Disputes, Refunds & Substandard Work
    if (/dispute|not satisfied|bad work|poor work|refund|artisan ran away|did not show up|problem|complaint/.test(q)) {
      return "### Safety & Dispute Resolution ⚖️\n\n- **Do NOT release escrow funds** if the job is incomplete, substandard, or damaged.\n- Click **Raise Dispute** in your Jobs & Escrow dashboard.\n- 9jaKonet's mediation team will step in, review photos and contract terms, and can mandate complete rework or issue a **full refund** back to your account.\n- Remember: Never pay cash off-platform, as only on-platform escrow contracts are protected!";
    }

    // 9. Hiring Process & Booking
    if (/hire|book|find artisan|post job|create job|contract|invite/.test(q)) {
      return "### How to Hire an Artisan on 9jaKonet 🚀\n\n1. Click **Explore** in the navigation bar.\n2. Filter by trade (Plumber, Electrician, etc.) and state (Lagos, Abuja, Rivers, etc.).\n3. Review ratings, reviews, verified badges, and hourly rates.\n4. Send a message to agree on scope, or click **Create Job / Contract**.\n5. Fund the contract into Paystack Escrow to begin work!";
    }

    // 10. Contact Support & Admin Help
    if (/support|contact|help|email|phone number|call|admin|customer care/.test(q)) {
      return "### 9jaKonet Support & Customer Concierge 💬\n\nNeed direct assistance from our management team?\n\n- **Official Support Email**: `info@mooregloballtd.online`\n- **Helpdesk Hours**: Monday – Saturday, 8:00 AM – 7:00 PM (WAT)\n- **Live Dispute Assistance**: Accessible 24/7 directly from your Jobs & Escrow dashboard.";
    }

    // 11. Greetings & Pleasantries
    if (/^(hello|hi|hey|good morning|good afternoon|good evening|howdy|what's up|greet)/.test(q)) {
      return "Hello! 👋 Welcome to **9jaKonet**, Nigeria's premier artisan marketplace!\n\nI am KonetBot, your dedicated support assistant. I can help you with:\n\n- 🔍 **Finding Verified Artisans** (Electricians, Plumbers, Carpenters, AC Technicians, etc.)\n- 🛡️ **Paystack Escrow Protection** (How your money stays 100% safe)\n- 📍 **Live Location & Safety Verification**\n- ✉️ **The 6-Digit Email OTP Release Process**\n- 💼 **Artisan Registration & 90% Bank Payouts**\n\nWhat would you like to explore today?";
    }

    // 12. Check if question is outside 9jaKonet
    const isOutOfScope = 
      /recipe|cook|food ingredients|premier league|football score|who won|election|president|governor|who is the king|write python|write code|javascript code|react code|fix my bug|translate french|movie|cinema|actor|celebrity|weather in (london|tokyo|paris|new york)|solve 2\+|solve x|calculate 2|cryptocurrency investment|bitcoin price/.test(q) &&
      !/artisan|9jakonet|escrow|paystack|wallet|job|contract|nigeria/.test(q);

    if (isOutOfScope) {
      return "Hello! I am KonetBot, your dedicated 9jaKonet assistant. I am specialized exclusively in helping you with the **9jaKonet platform** — including finding verified Nigerian artisans, Paystack escrow protection, OTP release codes, artisan registration, and wallet withdrawals. How can I help you with 9jaKonet today?";
    }

    // Default rich assistant reply
    return `Thank you for asking! As your **9jaKonet** support concierge, I'm here to ensure you have a seamless experience on our platform.\n\nYou can ask me about:\n\n- **Hiring Artisans**: How to browse and hire verified plumbers, electricians, AC techs, and carpenters in Lagos, Abuja, and nationwide.\n- **Escrow Security**: How your money is safely locked in Paystack Escrow until you approve the work.\n- **6-Digit OTP Release**: How dual-verification protects both customers and artisans from fraudulent payouts.\n- **Live GPS Traceability**: How our real-time location safeguards home and office visits.\n- **Artisan Payouts**: How verified artisans receive 90% net earnings directly into Nigerian bank accounts.\n\nPlease let me know which of these you would like to know more about!`;
  }

  app.post('/api/bot/chat', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'A message is required.' });
    }

    const trimmedMessage = message.trim();
    const ai = getGeminiClient();

    if (!ai) {
      // Use our comprehensive 9jaKonet-scoped fallback responder
      const reply = getFallbackBotReply(trimmedMessage);
      return res.json({ success: true, reply });
    }

    try {
      // Format chat messages
      const formattedContents: any[] = [];

      // Add recent history (up to last 6 turns)
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item && item.text) {
            formattedContents.push({
              role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.text }]
            });
          }
        }
      }

      // Add current message
      formattedContents.push({
        role: 'user',
        parts: [{ text: trimmedMessage }]
      });

      // Try candidate models in order, prioritizing flash models for fast, reliable responses
      const candidateModels = ['gemini-3.1-flash', 'gemini-3.1-pro-preview', 'gemini-3.0-flash'];
      let reply: string | null = null;

      for (const model of candidateModels) {
        try {
          // 8-second timeout per model attempt
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
          const apiPromise = ai.models.generateContent({
            model,
            contents: formattedContents,
            config: {
              systemInstruction: KONETBOT_SYSTEM_INSTRUCTION,
              temperature: 0.7,
            }
          }).then(res => res?.text || null);

          const result = await Promise.race([apiPromise, timeoutPromise]);
          if (result && typeof result === 'string' && result.trim()) {
            reply = result.trim();
            break;
          }
        } catch (modelErr: any) {
          const errStr = modelErr?.message || String(modelErr);
          console.warn(`[KonetBot] Model ${model} returned: ${errStr.slice(0, 100)}. Trying next model...`);
        }
      }

      const finalReply = reply || getFallbackBotReply(trimmedMessage);
      res.json({ success: true, reply: finalReply });
    } catch (error) {
      console.warn('[KonetBot] Handling request with local 9jaKonet engine:', error);
      const fallbackReply = getFallbackBotReply(trimmedMessage);
      res.json({ success: true, reply: fallbackReply });
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

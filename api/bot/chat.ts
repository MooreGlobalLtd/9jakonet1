import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getFallbackBotReply(userPrompt: string): string {
  const q = userPrompt.toLowerCase().trim();
  
  if (/plumber|plumbing|pipe|leak|tap|water heater|sink|borehole|water pump|drainage/.test(q)) {
    return `### Verified Plumbers on 9jaKonet 🔧\nYes! You can hire vetted, experienced plumbers on 9jaKonet across **Lagos (Ikeja, Lekki, Yaba, Surulere, Ikorodu, etc.), Abuja, Port Harcourt, Ibadan**, and all 36 states.\n\n- **Services**: Emergency pipe leaks, bathroom & toilet sanitary fittings, borehole pumping machines, drainage unblocking, and water tank installations.\n- **How to Hire**: Go to **Explore** ➜ filter by Trade (**Plumbing**) and your State ➜ compare reviews and ratings ➜ click **Hire** to fund the Paystack Escrow.\n- **Protection**: Your money stays locked in escrow until the plumbing job is completed and tested by you!`;
  }
  
  if (/electrician|electrical|wiring|light|fuse|inverter|solar|generator|gen repair/.test(q)) {
    return `### Certified Electricians & Solar Technicians ⚡\n9jaKonet connects you with licensed electrical technicians and solar specialists across Nigeria:\n\n- **Services**: House wiring & conduit piping, changeover switches, solar panel mounting, hybrid inverter configuration, circuit breaker troubleshooting, and soundproof generator repairs.\n- **Safety Vetted**: All technicians submit trade certifications, government ID, and live GPS verification.\n- **Escrow Guarantee**: Payment is secured via Paystack and only released via your 6-digit email OTP after electrical testing is complete.`;
  }
  
  if (/carpenter|furniture|cabinet|roofing|wood|wardrobe|bed frame|kitchen cabinet/.test(q)) {
    return `### Master Carpenters & Furniture Makers 🪚\nLooking for quality woodwork? On 9jaKonet, you can hire verified carpenters for:\n\n- Custom kitchen cabinets, modern wardrobes, bed frames, flush doors, and roofing truss repairs.\n- Polishing, furniture repair, and security door lock installations.\n- Browse portfolio photos on each carpenter's profile in the **Explore** tab to inspect completed projects before booking.`;
  }
  
  if (/ac|air condition|refrigerator|fridge|cooling|chiller|gas refill/.test(q)) {
    return `### AC Technicians & Refrigeration Specialists ❄️\nGet rapid, professional cooling and HVAC repairs across Nigeria:\n\n- Gas refilling (R22 / R410), uninstallation/mounting, compressor replacements, coil cleaning, and leak detection.\n- Transparent hourly or flat service rates are visible directly on each technician's profile with zero hidden charges.`;
  }
  
  if (/mechanic|car|auto|vehicle|towing|vulcanizer|engine|brake|service/.test(q)) {
    return `### Mobile Mechanics & Auto Repair 🚗\nStranded on the road or need home servicing? 9jaKonet offers rapid dispatch for auto technicians:\n\n- **Services**: Mobile car diagnostics, engine tuning, brake pad replacements, suspension repairs, vulcanizing, and emergency towing.\n- **Live Tracking**: Once hired, you can require the mechanic to activate their live GPS location so you can track their ETA to your vehicle.`;
  }
  
  if (/cleaner|cleaning|laundry|fumigation|pest control|housekeeping/.test(q)) {
    return `### Cleaning & Fumigation Services 🧹\nMaintain a spotless home or office with 9jaKonet cleaning professionals:\n\n- **Services**: Deep house cleaning, post-construction cleanup, upholstery/sofa washing, pest control & fumigation, and professional laundry services.\n- **Trust**: All cleaners are background-checked with KYC verification to ensure your property remains secure.`;
  }
  
  if (/escrow|pay|payment|fraud|safe|scam|protect|paystack|wallet|release/.test(q)) {
    return `### 9jaKonet Paystack Escrow Vault 🔒\nYour money is 100% safe on 9jaKonet! We eliminate fraud and "runaway artisans" using our strict Escrow system:\n\n1. **Fund the Escrow**: When you hire an artisan, your payment goes into the secure 9jaKonet Vault (powered by Paystack), NOT to the artisan's pocket.\n2. **Work Begins**: The artisan is notified that the money is secured and immediately begins the job.\n3. **Release via OTP**: Once the job is completed to your satisfaction, we send a secret 6-digit OTP to your email. You enter this code to authorize the release of funds to the artisan.\n4. **Disputes**: If the artisan does a bad job, you can open a dispute. Our management team will step in, review the evidence, and refund your wallet if necessary!`;
  }
  
  if (/\bkyc\b|\bnin\b|\bbvn\b|verify|passport|id card|reject|pending/.test(q)) {
    return `### KYC Verification 🛡️\nTo maintain a trusted platform, all Artisans MUST pass strict KYC (Know Your Customer) screening before they can accept jobs or withdraw funds.\n\n- **Requirements**: We accept standard Nigerian NIN (National Identity Number), International Passports, Voter's Cards, or Driver's Licenses.\n- **Selfie Verification**: A live, clear selfie is required to cross-match with the ID document.\n- **Processing**: Our Verification Desk manually reviews submissions. This usually takes 1-3 hours. If rejected, you will see the reason on your dashboard and can re-submit clear documents.`;
  }
  
  if (/withdraw|cash out|payout|bank|account|transfer|fee|commission/.test(q)) {
    return `### Artisan Withdrawals & Payouts 💸\nCongratulations on completing your jobs!\n\n- **Commission**: 9jaKonet charges a transparent 10% platform fee on all completed jobs. You keep 90%.\n- **Bank Setup**: Ensure you have added your valid Nigerian Bank Account in the **Profile** tab.\n- **Payout Process**: Once a customer releases your escrow, the funds move to your Wallet. Click "Withdraw", and our admin team will disburse the funds directly to your local bank account via Paystack Transfers.\n- **Timeline**: Payouts are typically processed within 24 hours of request.`;
  }
  
  if (/gps|location|map|track|where|trace/.test(q)) {
    return `### Live GPS & Safety Tracking 📍\nSafety is our top priority. For jobs requiring home visits:\n\n- The platform uses secure browser GPS to pinpoint the exact location of service delivery.\n- Artisans and customers are required to enable location services. This acts as an emergency digital footprint.\n- Location data is strictly confidential and only accessed by the Admin Security Desk in the event of a dispute or emergency.`;
  }
  
  if (/hello|hi|hey|good morning|good afternoon|good evening|who are you|help|support/.test(q)) {
    return `### Welcome to 9jaKonet! 🇳🇬🤝\nHello! I am the **9jaKonet Smart Assistant**. I am here to help you navigate Nigeria's safest artisan hiring platform.\n\nI can answer any questions you have about:\n- Hiring plumbers, electricians, carpenters, mechanics, etc.\n- How our secure **Paystack Escrow** protects your money.\n- KYC verification and security rules.\n- Artisan payouts, commissions, and bank withdrawals.\n\nWhat do you need help with today?`;
  }

  return "### 9jaKonet Support & Customer Concierge 💬\n\nNeed direct assistance from our management team?\n\n- **Official Support Email**: `info@mooregloballtd.online`\n- **Helpdesk Hours**: Monday – Saturday, 8:00 AM – 7:00 PM (WAT)\n- **Live Dispute Assistance**: Accessible 24/7 directly from your Jobs & Escrow dashboard.";
}

const KONETBOT_SYSTEM_INSTRUCTION = `You are the official "9jaKonet Customer Success Concierge", an expert AI assistant exclusively built for the "9jaKonet" platform. 
9jaKonet is a Nigerian artisan and professional services marketplace.

Core Platform Mechanics to Explain when asked:
1. Paystack Escrow: Money is paid into 9jaKonet's secure Paystack vault. It is ONLY released to the artisan when the customer is satisfied and provides a 6-digit OTP code sent to their email.
2. Safety & KYC: All artisans must verify their NIN/Passport/Driver's License and take a live selfie before they can withdraw funds or accept major jobs. The platform also has Live GPS Tracking for security during home visits.
3. 10% Commission: Artisans keep 90% of the job amount. 9jaKonet takes a 10% platform fee for escrow management and support.

Tone: Professional, extremely polite, distinctly Nigerian-friendly but formal (e.g., occasional use of "Chief", "Oga", "Madam" in a highly respectful context is okay, but keep it mostly professional). Use clear formatting (bullet points, bold text).

Restrictions:
- You ONLY answer questions related to 9jaKonet, hiring artisans, escrow, platform rules, and trades (plumbing, electrical, carpentry, mechanic, cleaning, etc.).
- If a user asks a general knowledge question unrelated to home services or the platform, politely decline and steer them back to 9jaKonet services.
- NEVER invent features that don't exist.
- Official Support Email is info@mooregloballtd.online`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'A message is required.' });
  }

  const trimmedMessage = message.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const reply = getFallbackBotReply(trimmedMessage);
    return res.json({ success: true, reply });
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const formattedContents: any[] = [];

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

    formattedContents.push({
      role: 'user',
      parts: [{ text: trimmedMessage }]
    });

    const candidateModels = ['gemini-3.1-flash', 'gemini-3.1-pro-preview', 'gemini-3.0-flash'];
    let reply: string | null = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
        const apiPromise = genAI.models.generateContent({
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
        console.warn(\`[KonetBot Vercel] Model \${model} failed. Trying next...\`);
      }
    }

    const finalReply = reply || getFallbackBotReply(trimmedMessage);
    res.json({ success: true, reply: finalReply });
  } catch (error) {
    console.warn('[KonetBot Vercel] Handling request with local 9jaKonet engine:', error);
    const fallbackReply = getFallbackBotReply(trimmedMessage);
    res.json({ success: true, reply: fallbackReply });
  }
}

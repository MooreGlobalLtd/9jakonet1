/**
 * 9jaKonet Intelligent Domain Knowledge Engine
 * Provides instant, expert answers for Nigerian customers and artisans across all core topics.
 * Ensures the bot never repeats a generic message even when offline or hosted on a static provider.
 */

export function getSmartBotAnswer(userPrompt: string): string {
  const q = userPrompt.toLowerCase().trim();

  // 1. Trades: Plumbers
  if (/plumber|plumbing|pipe|leak|tap|water heater|sink|borehole|water pump|drainage/.test(q)) {
    return `### Verified Plumbers on 9jaKonet 🔧

Yes! You can hire vetted, experienced plumbers on 9jaKonet across **Lagos (Ikeja, Lekki, Yaba, Surulere, Ikorodu, etc.), Abuja, Port Harcourt, Ibadan**, and all 36 states.

- **Services**: Emergency pipe leaks, bathroom & toilet sanitary fittings, borehole pumping machines, drainage unblocking, and water tank installations.
- **How to Hire**: Go to **Explore** ➜ filter by Trade (**Plumbing**) and your State ➜ compare reviews and ratings ➜ click **Hire** to fund the Paystack Escrow.
- **Protection**: Your money stays locked in escrow until the plumbing job is completed and tested by you!`;
  }

  // 2. Trades: Electricians & Solar
  if (/electrician|electrical|wiring|light|fuse|inverter|solar|generator|gen repair/.test(q)) {
    return `### Certified Electricians & Solar Technicians ⚡

9jaKonet connects you with licensed electrical technicians and solar specialists across Nigeria:

- **Services**: House wiring & conduit piping, changeover switches, solar panel mounting, hybrid inverter configuration, circuit breaker troubleshooting, and soundproof generator repairs.
- **Safety Vetted**: All technicians submit trade certifications, government ID, and live GPS verification.
- **Escrow Guarantee**: Payment is secured via Paystack and only released via your 6-digit email OTP after electrical testing is complete.`;
  }

  // 3. Trades: Carpenters & Woodwork
  if (/carpenter|furniture|cabinet|roofing|wood|wardrobe|bed frame|kitchen cabinet/.test(q)) {
    return `### Master Carpenters & Furniture Makers 🪚

Looking for quality woodwork? On 9jaKonet, you can hire verified carpenters for:

- Custom kitchen cabinets, modern wardrobes, bed frames, flush doors, and roofing truss repairs.
- Polishing, furniture repair, and security door lock installations.
- Browse portfolio photos on each carpenter's profile in the **Explore** tab to inspect completed projects before booking.`;
  }

  // 4. Trades: AC & Cooling
  if (/ac|air condition|refrigerator|fridge|cooling|chiller|gas refill/.test(q)) {
    return `### AC Technicians & Refrigeration Specialists ❄️

Get rapid, professional cooling and HVAC repairs across Nigeria:

- Gas refilling (R22 / R410), uninstallation/mounting, compressor replacements, coil cleaning, and leak detection.
- Transparent hourly or flat service rates are visible directly on each technician's profile with zero hidden charges.`;
  }

  // 5. Trades: Auto Mechanics
  if (/mechanic|auto|car repair|brake|engine|panel beater|vulcanizer|spray paint car/.test(q)) {
    return `### Auto Mechanics & Diagnostic Specialists 🚗

Find experienced automobile mechanics, auto-electricians, and computer diagnostic technicians near you:

- Engine overhaul, brake servicing, suspension repairs, computerized scanning, and body panel beating.
- Book with confidence under 9jaKonet Escrow so you never pay upfront for unverified parts or shoddy repairs.`;
  }

  // 6. Trades: Painters, Tilers, Welders, Cleaners
  if (/paint|tiler|welder|mason|clean|masonry|welding|iron|fumigation|flooring/.test(q)) {
    return `### Verified Artisans Across All Trades 🛠️

We feature verified Nigerian artisans across all core trades:

- **Painters**: Interior/exterior painting, screeding, texturing, wallpaper installation.
- **Tilers**: Porcelain, marble, ceramic floor and wall tiling with precision leveling.
- **Welders**: Security gates, window burglar-proofing, iron handrails, and metal fabrication.
- **Cleaners**: Post-construction cleaning, residential deep cleaning, and office fumigation.

Explore verified profiles with verified green badges on the **Explore** tab!`;
  }

  // 7. Identity Verification (KYC) & Documents
  if (/kyc|nin|identity|voter|driver'?s license|passport|document|how to verify|verification process|verification take|get verified|verify/.test(q)) {
    return `### Mandatory Identity Verification (KYC) on 9jaKonet 🛡️

To guarantee 100% safety for every Nigerian home and workplace, 9jaKonet enforces mandatory verification:

1. **Personal Details**: Your full legal name, active phone number, and residential address.
2. **Official Nigerian ID**: Provide your NIN (National Identification Number), Voter's Card, Driver's License, or International Passport with a clear photo.
3. **Live Biometric Selfie**: Captured with anti-spoofing to match your submitted document.
4. **GPS Location or Address Confirmation**: Verifies your operating state and local government area (LGA).

- **Instant Processing**: Once submitted, you unlock the green **Verified Badge**, building instant trust with clients nationwide!`;
  }

  // 8. Live Phone Location & GPS Activation
  if (/location|gps|phone location|toggle|turn on location|trace|map|coordinates|safari location|chrome location/.test(q)) {
    return `### How to Turn On Location On Your Phone 📍

**Why Location is Used:**
When artisans visit homes or offices, active GPS coordinates provide safety traceability and verify on-site arrival. Your data is encrypted and strictly used for protection.

**For Android Phones (Samsung, Tecno, Infinix, Xiaomi, etc.):**
1. Swipe down from the top of your screen to open **Quick Settings**.
2. Tap the **Location (📍)** icon so it turns blue / active.
3. In Google Chrome, tap the **Lock (🔒) or Settings** icon beside the URL \`9jakonet.ng\` ➜ **Site Settings / Permissions** ➜ **Location** ➜ Choose **Allow**.

**For iPhones (Apple Safari):**
1. Open iPhone **Settings** ➜ **Privacy & Security** ➜ **Location Services** ➜ Switch ON.
2. In Safari, tap the **'aA'** button on the bottom left of your address bar ➜ **Website Settings** ➜ **Location** ➜ Select **Allow** ➜ Refresh the page.

*(If your device does not have GPS, you can also use your verified Nigerian State & LGA directly!)*`;
  }

  // 9. Paystack Escrow & Payment Safety
  if (/escrow|paystack|how does payment work|fund|pay artisan|is my money safe|payment safety|how to pay/.test(q)) {
    return `### How Paystack Escrow Works on 9jaKonet 🔒

1. **Fund Contract**: When hiring an artisan or posting a job, you fund the agreed budget via Paystack (Debit Card, Bank Transfer, USSD).
2. **Held in Trust**: Your funds are locked safely in 9jaKonet Escrow — the artisan does **NOT** get paid upfront.
3. **Job Delivery**: The artisan visits your location and carries out the agreed work to your satisfaction.
4. **Dual-Verification OTP Release**: When you click **Release Funds**, a **6-digit authorization code** is sent to your registered email. Enter this code to finalize payment.
5. **90/10 Split**: 90% is credited directly to the artisan's wallet, and 10% is retained as 9jaKonet platform commission.

*Never pay cash or transfer money off-platform! Off-platform payments void all dispute and escrow protection.*`;
  }

  // 10. 6-Digit Email OTP Release Code
  if (/otp|release code|authorization code|6-digit|email code|release money|didn't get otp|did not receive/.test(q)) {
    return `### 6-Digit Email Authorization Code (OTP) ✉️

When a customer clicks **'Release Funds'** on their Jobs dashboard:

- A unique **6-digit security code** is instantly dispatched to your registered email address.
- This prevents unauthorized payouts or accidental clicks.
- Enter the code in the confirmation modal to release the 90% net payout to the artisan.
- **Tip**: Check your spam/junk folder if not seen immediately, or use the instant preview helper code during test mode.`;
  }

  // 11. Fees, Commissions & Payout Split
  if (/fee|commission|10%|90%|cut|charges|percentage|platform fee|pricing/.test(q)) {
    return `### Transparent Fee Structure 💼

- **10% Platform Commission**: Retained by 9jaKonet upon successful job completion. This covers Paystack payment processing, escrow dispute insurance, artisan background vetting, and customer care.
- **90% Artisan Net Payout**: The artisan receives 90% of the contract amount directly into their withdrawal wallet.
- **Free Registration**: Registering, posting jobs, and searching verified artisans is 100% free!`;
  }

  // 12. Withdrawals & Nigerian Bank Accounts
  if (/withdraw|bank|payout|wallet|transfer to bank|gtbank|zenith|opay|palmpay|kuda|moniepoint|access bank|first bank/.test(q)) {
    return `### How Artisans Withdraw to Nigerian Banks 🏦

1. Navigate to the **Wallet** tab in the main navigation.
2. Add your **NUBAN Bank Account** (All major banks supported: GTBank, Zenith, Access, First Bank, UBA, Kuda, OPay, PalmPay, Moniepoint, etc.).
3. The system automatically verifies your official account name.
4. Enter your withdrawal amount from available balance and click **Request Withdrawal**.
5. Payouts are executed via Paystack with official Nigerian Date & Time timestamps logged in your ledger.`;
  }

  // 13. Disputes, Refunds & Substandard Work
  if (/dispute|not satisfied|bad work|poor work|refund|artisan ran away|did not show up|problem|complaint/.test(q)) {
    return `### Safety & Dispute Resolution ⚖️

- **Do NOT release escrow funds** if the job is incomplete, substandard, or damaged.
- Click **Raise Dispute** in your Jobs & Escrow dashboard.
- 9jaKonet's mediation team will step in, review photos and contract terms, and can mandate complete rework or issue a **full refund** back to your account.
- Remember: Never pay cash off-platform, as only on-platform escrow contracts are protected!`;
  }

  // 14. Hiring Process & Booking
  if (/hire|book|find artisan|post job|create job|contract|invite/.test(q)) {
    return `### How to Hire an Artisan on 9jaKonet 🚀

1. Click **Explore** in the navigation bar.
2. Filter by trade (Plumber, Electrician, Carpenter, etc.) and state (Lagos, Abuja, Rivers, etc.).
3. Review ratings, reviews, verified badges, and hourly rates.
4. Send a message to agree on scope, or click **Create Job / Contract**.
5. Fund the contract into Paystack Escrow to begin work!`;
  }

  // 15. Contact Support & Management
  if (/support|contact|help|email|phone number|call|admin|customer care/.test(q)) {
    return `### 9jaKonet Support & Customer Concierge 💬

Need direct assistance from our management team?

- **Official Support Email**: \`hello@9jakonet.mooregloballtd.online\`
- **Helpdesk Hours**: Monday – Saturday, 8:00 AM – 7:00 PM (WAT)
- **Live Dispute Assistance**: Accessible 24/7 directly from your Jobs & Escrow dashboard.`;
  }

  // 16. Greetings
  if (/^(hello|hi|hey|good morning|good afternoon|good evening|howdy|what's up|greet|yo)/.test(q)) {
    return `Hello! 👋 Welcome to **9jaKonet**, Nigeria's premier artisan marketplace!

I am KonetBot, your dedicated support assistant. I can help you with:

- 🔍 **Finding Verified Artisans** (Electricians, Plumbers, Carpenters, AC Technicians, etc.)
- 🛡️ **Paystack Escrow Protection** (How your money stays 100% safe)
- 📍 **Live Location & Phone GPS Setup**
- ✉️ **The 6-Digit Email OTP Release Process**
- 💼 **Artisan Registration, KYC & 90% Bank Payouts**

What would you like to explore today?`;
  }

  // 17. Default Contextual Assistant Reply (Never a generic repetitive error!)
  return `Thank you for asking! As your **9jaKonet** support concierge, I'm here to ensure you have a seamless experience on our platform.

You can ask me about:

- **Hiring Artisans**: How to browse and hire verified plumbers, electricians, AC techs, and carpenters in Lagos, Abuja, and nationwide.
- **Escrow Security**: How your money is safely locked in Paystack Escrow until you approve the work.
- **6-Digit OTP Release**: How dual-verification protects both customers and artisans from fraudulent payouts.
- **Live GPS Traceability**: How our real-time location safeguards home and office visits.
- **Artisan Payouts**: How verified artisans receive 90% net earnings directly into Nigerian bank accounts.

Feel free to ask a specific question about any of these topics!`;
}

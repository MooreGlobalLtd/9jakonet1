export function getSmartBotAnswer(q: string): string {
  q = q.toLowerCase();

  // Helper to ensure strict word boundaries for all keywords
  const hasWords = (words: string[]) => {
    return words.some(w => {
      // Escape for regex, then wrap in word boundaries. 
      // If the phrase has spaces or punctuation, word boundaries still apply to the start and end words.
      return new RegExp('\\b' + w.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(q);
    });
  };

  // 1. Plumbers
  if (hasWords(['plumber', 'plumbing', 'pipe leak', 'water tank', 'borehole', 'drainage', 'toilet', 'bathroom'])) {
    return `### Professional Plumbers 🚰

Yes! You can hire vetted, experienced plumbers on 9jaKonet across **Lagos (Ikeja, Lekki, Yaba, Surulere, Ikorodu, etc.), Abuja, Port Harcourt, Ibadan**, and all 36 states.

- **Services**: Emergency pipe leaks, bathroom & toilet sanitary fittings, borehole pumping machines, drainage unblocking, and water tank installations.
- **How to Hire**: Go to **Explore** ➜ filter by Trade (**Plumbing**) and your State ➜ compare reviews and ratings ➜ click **Hire** to fund the Paystack Escrow.`;
  }

  // 2. Trades: Electricians & Solar
  if (hasWords(['electrician', 'electrical', 'solar', 'inverter', 'wiring', 'power issue', 'generator'])) {
    return `### Certified Electricians & Solar Technicians ⚡

9jaKonet connects you with licensed electrical technicians and solar specialists across Nigeria:

- **Services**: Solar panel/inverter installations, full house wiring, prepaid meter setups, generator repairs, and emergency fault fixing.
- **Escrow Guarantee**: Payment is secured via Paystack and only released via your 6-digit email OTP after electrical testing is complete.`;
  }

  // 3. Trades: Carpenters
  if (hasWords(['carpenter', 'carpentry', 'woodwork', 'furniture', 'wardrobe', 'cabinet', 'roofing'])) {
    return `### Expert Carpenters & Woodworkers 🪚

Need custom furniture, roofing, or wardrobe installations? 

- Browse portfolio photos on each carpenter's profile in the **Explore** tab to inspect completed projects before booking.
- All carpenters are identity-verified (NIN/Driver's License) for safe home visits.`;
  }

  // 4. Trades: AC & Cooling
  if (hasWords(['ac', 'ac technician', 'air condition', 'air conditioning', 'refrigerator', 'fridge', 'cooling', 'chiller', 'gas refill'])) {
    return `### AC & Cooling Specialists ❄️

Get rapid, professional cooling and HVAC repairs across Nigeria:

- Gas refilling (R22 / R410), uninstallation/mounting, compressor replacements, coil cleaning, and leak detection.
- Transparent hourly or flat service rates are visible directly on each technician's profile with zero hidden charges.`;
  }

  // 5. General Artisans
  if (hasWords(['artisan', 'mechanic', 'tailor', 'painter', 'cleaner', 'tiler', 'welder', 'barber', 'makeup'])) {
    return `### Find Any Verified Artisan 🛠️

We feature verified Nigerian artisans across all core trades:

1. Go to the **Explore** page.
2. Tap the **Trade Category** search box or choose from the quick filters (Tailor, Mechanic, Painter, Tiler, Welder, Cleaner, etc.).
3. Filter by your exact location (State or City) to find professionals right in your neighborhood!`;
  }

  // 6. Verification & Safety (KYC)
  if (hasWords(['kyc', 'verify', 'verification', 'safe', 'safety', 'nin', 'bvn', 'driver license', 'fake', 'scam'])) {
    return `### 9jaKonet Safety & Verification (KYC) 🛡️

To guarantee 100% safety for every Nigerian home and workplace, 9jaKonet enforces mandatory verification:

1. **Personal Details**: Your full legal name, active phone number, and residential address.
2. **Government ID**: A valid NIN slip, Driver's License, or Voter's Card.
3. **Live Selfie Map**: A real-time photo capture mapped to your device.

*Artisans cannot accept jobs or withdraw funds until their KYC is manually approved by our admins.*`;
  }

  // 7. Location & GPS
  if (hasWords(['location', 'gps', 'phone location', 'toggle', 'turn on location', 'trace', 'map', 'coordinates', 'safari location', 'chrome location'])) {
    return `### How to Enable Location (GPS) 📍

When artisans visit homes or offices, active GPS coordinates provide safety traceability and verify on-site arrival. Your data is encrypted and strictly used for protection.

**To turn it on:**
1. Check the top bar of your browser (near the URL) for a prompt asking for Location Access and click **Allow**.
2. Tap the **Location (📍)** icon so it turns blue / active.

**If it is blocked on your phone:**
- **iPhone/iOS**: 
  1. Open iPhone **Settings** ➜ **Privacy & Security** ➜ **Location Services** ➜ Switch ON.
  2. Scroll down to Safari (or Chrome) ➜ select **While Using the App**.
- **Android**: 
  1. Go to phone **Settings** ➜ **Location** ➜ Turn ON.
  2. Open Chrome settings ➜ **Site Settings** ➜ **Location** ➜ Allow for 9jaKonet.`;
  }

  // 8. The Core Value Proposition
  if (hasWords(['what is 9jakonet', 'about us', 'who are you', 'how does this work', 'what do you do'])) {
    return `### Welcome to 9jaKonet! 🇳🇬

**9jaKonet** is Nigeria's most secure and reliable artisan marketplace.

We connect households and businesses with heavily vetted, background-checked professionals (Plumbers, Electricians, AC Techs, Carpenters, etc.). 

**Why use 9jaKonet?**
- 🛡️ **Zero Fraud**: You pay into Paystack Escrow. The artisan only gets paid when you are 100% satisfied.
- 📍 **GPS Traceability**: We track artisan movement for home-visit safety.
- 💳 **Seamless Payouts**: Artisans receive their 90% earnings directly into their local bank accounts.`;
  }

  // 9. Paystack Escrow & Payment Safety
  if (hasWords(['escrow', 'paystack', 'how does payment work', 'fund', 'pay artisan', 'is my money safe', 'payment safety', 'how to pay'])) {
    return `### How Paystack Escrow Works on 9jaKonet 🔒

1. **Fund Contract**: When hiring an artisan or posting a job, you fund the agreed budget via Paystack (Debit Card, Bank Transfer, USSD).
2. **Funds Held in Trust**: Your funds are locked safely in 9jaKonet Escrow — the artisan does **NOT** get paid upfront.
3. **Job Delivery**: The artisan visits your location and carries out the agreed work to your satisfaction.
4. **Dual-Verification OTP Release**: When you click **Release Funds**, a **6-digit authorization code** is sent to your registered email. Enter this code to finalize payment.
5. **90/10 Split**: 90% is credited directly to the artisan's wallet, and 10% is retained as 9jaKonet platform commission.

*Never pay cash or transfer money off-platform! Off-platform payments void all dispute and escrow protection.*`;
  }

  // 10. 6-Digit Email OTP Release Code
  if (hasWords(['otp', 'release code', 'authorization code', '6-digit', 'email code', 'release money', 'didn\'t get otp', 'did not receive'])) {
    return `### 6-Digit Email Authorization Code (OTP) ✉️

When a customer clicks **'Release Funds'** on their Jobs dashboard:
- A unique **6-digit security code** is instantly dispatched to your registered email address.
- This prevents unauthorized payouts or accidental clicks.
- Enter the code in the confirmation modal to release the 90% net payout to the artisan.
- **Tip**: Check your spam/junk folder if not seen immediately, or use the instant preview helper code during test mode.`;
  }

  // 11. Fees, Commissions & Payout Split
  if (hasWords(['fee', 'commission', '10%', '90%', 'cut', 'charges', 'percentage', 'platform fee', 'pricing'])) {
    return `### Transparent Fee Structure 💼

- **10% Platform Commission**: Retained by 9jaKonet upon successful job completion. This covers Paystack payment processing, escrow dispute insurance, artisan background vetting, and customer care.
- **90% Artisan Net Payout**: The artisan receives 90% of the contract amount directly into their withdrawal wallet.
- **Free Registration**: Registering, posting jobs, and searching verified artisans is 100% free!`;
  }

  // 12. Withdrawals & Nigerian Bank Accounts
  if (hasWords(['withdraw', 'withdrawal', 'bank', 'payout', 'wallet', 'transfer to bank', 'gtbank', 'zenith', 'opay', 'palmpay', 'kuda', 'moniepoint', 'access bank', 'first bank'])) {
    return `### How Artisans Withdraw to Nigerian Banks 🏦

1. Navigate to the **Wallet** tab in the main navigation.
2. Add your **NUBAN Bank Account** (All major banks supported: GTBank, Zenith, Access, First Bank, UBA, Kuda, OPay, PalmPay, Moniepoint, etc.).
3. The system automatically verifies your official account name.
4. Enter your withdrawal amount from available balance and click **Request Withdrawal**.
5. Payouts are executed via Paystack with official Nigerian Date & Time timestamps logged in your ledger.`;
  }

  // 13. Disputes, Refunds & Substandard Work
  if (hasWords(['dispute', 'not satisfied', 'bad work', 'poor work', 'refund', 'artisan ran away', 'did not show up', 'problem', 'complaint'])) {
    return `### Safety & Dispute Resolution ⚖️

- **Do NOT release escrow funds** if the job is incomplete, substandard, or damaged.
- Click **Raise Dispute** in your Jobs & Escrow dashboard.
- 9jaKonet's mediation team will step in, review photos and contract terms, and can mandate complete rework or issue a **full refund** back to your account.
- Remember: Never pay cash off-platform, as only on-platform escrow contracts are protected!`;
  }

  // 14. Hiring Process & Booking
  if (hasWords(['hire', 'book', 'find artisan', 'post job', 'create job', 'contract', 'invite'])) {
    return `### How to Hire an Artisan on 9jaKonet 🚀

1. Click **Explore** in the navigation bar.
2. Filter by trade (Plumber, Electrician, Carpenter, etc.) and state (Lagos, Abuja, Rivers, etc.).
3. Review ratings, reviews, verified badges, and hourly rates.
4. Send a message to agree on scope, or click **Create Job / Contract**.
5. Fund the contract into Paystack Escrow to begin work!`;
  }

  // 15. Contact Support & Management
  if (hasWords(['support', 'contact', 'help', 'email', 'phone number', 'call', 'admin', 'customer care'])) {
    return `### 9jaKonet Support & Customer Concierge 💬

Need direct assistance from our management team?

- **Official Support Email**: \`info@mooregloballtd.online\`
- **Helpdesk Hours**: Monday – Saturday, 8:00 AM – 7:00 PM (WAT)
- **Live Dispute Assistance**: Accessible 24/7 directly from your Jobs & Escrow dashboard.`;
  }

  // 16. How to Make Money / How Artisans Earn on 9jaKonet
  if (hasWords(['make money', 'earn', 'earn money', 'how do i get paid', 'income', 'charge', 'service fee', 'artisan work', 'getting jobs'])) {
    return `### How to Make Money as an Artisan on 9jaKonet 💰

1. **Sign Up for Free**: Choose **"I am an Artisan"** on the registration page.
2. **Complete Your Trade Profile**: Add your trade (Plumbing, Electrical, AC Repair, Carpentry, etc.), years of experience, hourly/flat rates, and upload photos of your past work.
3. **Get Verified**: Complete your identity verification (NIN, Driver's License, or Voter's Card) and capture your live selfie.
4. **Get Hired by Clients**: Customers in your area will contact you via chat or send job offers.
5. **Secure Escrow**: The client funds the contract into Paystack Escrow before you start work, ensuring guaranteed payment.
6. **Deliver & Get Paid**: When the job is completed, the client releases payment with an email OTP code. You receive **90% of the funds** directly into your 9jaKonet Wallet, which you can withdraw to your Nigerian bank account at any time!`;
  }

  // 17. Account Creation & Sign Up Help
  if (hasWords(['sign up', 'register', 'create account', 'login', 'log in', 'password', 'email address', 'create a new account'])) {
    return `### Creating an Account on 9jaKonet 📝

You can register on 9jaKonet easily in just two steps:

- **Sign Up with Email & Password**: Click **Sign Up** in the top navigation bar. Enter your full name, email address, choose a strong password, and select whether you need a service (**Customer**) or offer services (**Artisan**).
- **Google Sign-In**: Alternatively, you can click "Sign up with Google" for instant one-click onboarding.
- **Next Steps**:
  - **Customers**: Verify your phone number and address to book verified artisans safely.
  - **Artisans**: Fill out your trade profile (trade skills, bio, service areas) and complete identity verification to unlock your green verified badge!`;
  }

  // 18. Profile Photo & Updating Information
  if (hasWords(['profile photo', 'picture', 'change photo', 'upload picture', 'avatar', 'update profile', 'save changes'])) {
    return `### Managing Your Profile & Pictures 📸

- **Upload Profile Picture**: Go to **My Profile** in the top navigation menu. Click the camera icon directly on your profile avatar to upload and set your real picture!
- **Update Details**: You can update your Full Name, Phone Number, State, and Residential Address anytime.
- **Save Changes**: After updating your information, click the **"Save Changes"** button at the bottom of the form. The system will save your updates and confirm with a green "Saved!" indicator.`;
  }

  // 19. Greetings & Pleasantries
  if (hasWords(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', "what's up", 'greet', 'yo'])) {
    return `Hello! 👋 Welcome to **9jaKonet**, Nigeria's premier artisan marketplace!

I am KonetBot, your dedicated support assistant. I can help you with:
- 🔍 **Finding Verified Artisans** (Electricians, Plumbers, Carpenters, AC Technicians, etc.)
- 🛡️ **Paystack Escrow Protection** (How your money stays 100% safe)
- 📍 **Live Location & Phone GPS Setup**
- ✉️ **The 6-Digit Email OTP Release Process**
- 💼 **Artisan Registration, KYC & 90% Bank Payouts**

What would you like to explore today?`;
  }

  // 20. Out of Scope Check (so it doesn't give a default answer for completely random things)
  if (hasWords(['recipe', 'cook', 'premier league', 'football', 'election', 'president', 'write code', 'javascript', 'bug', 'translate', 'movie', 'weather', 'solve', 'bitcoin', 'crypto'])) {
     return "Hello! I am KonetBot, your dedicated 9jaKonet assistant. I am specialized exclusively in helping you with the **9jaKonet platform** — including finding verified Nigerian artisans, Paystack escrow protection, OTP release codes, artisan registration, and wallet withdrawals. How can I help you with 9jaKonet today?";
  }

  // 21. Dynamic Contextual Fallback based on User's Question
  const words = q.split(/\s+/).filter(w => w.length > 3);
  const keywordsStr = words.slice(0, 3).join(', ');
  
  return `Thank you for asking! As your **9jaKonet** support concierge, I'm here to ensure you have a seamless experience on our platform.

You can ask me about:

- **Hiring Artisans**: How to browse and hire verified plumbers, electricians, AC techs, and carpenters in Lagos, Abuja, and nationwide.
- **Escrow Security**: How your money is safely locked in Paystack Escrow until you approve the work.
- **6-Digit OTP Release**: How dual-verification protects both customers and artisans from fraudulent payouts.
- **Live GPS Traceability**: How our real-time location safeguards home and office visits.
- **Artisan Payouts**: How verified artisans receive 90% net earnings directly into Nigerian bank accounts.

Please let me know which of these you would like to know more about!`;
}

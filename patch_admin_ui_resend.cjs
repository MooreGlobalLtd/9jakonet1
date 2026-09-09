const fs = require('fs');

let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const target = `              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paystack Public Key (Client Checkout)</label>`;

const replacement = `              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resend API Key (Email Delivery / OTP)</label>
                <input 
                  type="password" 
                  placeholder="re_xxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs mb-1"
                  value={resendKeyInput}
                  onChange={(e) => setResendKeyInput(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mb-4">Required to send 6-digit Escrow OTPs to customers.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paystack Public Key (Client Checkout)</label>`;

if (file.includes('Resend API Key')) {
  console.log('Already patched.');
} else {
  file = file.replace(target, replacement);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
  console.log("Patched UI");
}

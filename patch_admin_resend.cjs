const fs = require('fs');

let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

file = file.replace("const [paystackSecretInput, setPaystackSecretInput] = useState(localStorage.getItem('paystack_secret_key') || '');", 
`const [paystackSecretInput, setPaystackSecretInput] = useState(localStorage.getItem('paystack_secret_key') || '');
  const [resendKeyInput, setResendKeyInput] = useState(localStorage.getItem('resend_api_key') || '');`);

file = file.replace("const snap = await getDoc(doc(db, 'system_config', 'paystack'));", 
`const snap = await getDoc(doc(db, 'system_config', 'paystack'));
        const resendSnap = await getDoc(doc(db, 'system_config', 'resend'));
        if (resendSnap.exists() && resendSnap.data().apiKey) {
          setResendKeyInput(resendSnap.data().apiKey);
          localStorage.setItem('resend_api_key', resendSnap.data().apiKey);
        }`);

const saveSettingsOld = `
  const handleSavePaystackSettings = async () => {
    const cleanPublic = paystackKeyInput.trim();
    const cleanSecret = paystackSecretInput.trim();

    if (!cleanPublic && !cleanSecret) {
      toast.info('Please enter your Paystack keys');
      return;
    }
`;

const saveSettingsNew = `
  const handleSavePaystackSettings = async () => {
    const cleanPublic = paystackKeyInput.trim();
    const cleanSecret = paystackSecretInput.trim();
    const cleanResend = resendKeyInput.trim();

    if (!cleanPublic && !cleanSecret && !cleanResend) {
      toast.info('Please enter your configuration keys');
      return;
    }
`;

file = file.replace(saveSettingsOld, saveSettingsNew);

file = file.replace("if (cleanSecret) localStorage.setItem('paystack_secret_key', cleanSecret);", 
`if (cleanSecret) localStorage.setItem('paystack_secret_key', cleanSecret);
      if (cleanResend) localStorage.setItem('resend_api_key', cleanResend);
      
      if (cleanResend) {
        await setDoc(doc(db, 'system_config', 'resend'), {
          apiKey: cleanResend,
          updatedAt: Date.now()
        }, { merge: true });
      }`);

const uiOld = `
            <CardContent>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paystack Public Key (Client Checkout)</label>
`;

const uiNew = `
            <CardContent>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Resend API Key (Email Delivery / OTP)</label>
                  <input 
                    type="password" 
                    placeholder="re_xxxxxxxxxxxxxxxxx"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                    value={resendKeyInput}
                    onChange={(e) => setResendKeyInput(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Get this free from <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Resend.com</a> to send OTP emails.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paystack Public Key (Client Checkout)</label>
`;

file = file.replace(uiOld.trim(), uiNew.trim());

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Patched AdminDashboard.tsx for Resend UI");

const fs = require('fs');

let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

// 1. Add toast import
if (!file.includes("import { toast } from 'sonner';")) {
  file = file.replace("import { Banknote, Building2, CheckCircle, Clock, Save, ShieldCheck } from 'lucide-react';", "import { Banknote, Building2, CheckCircle, Clock, Save, ShieldCheck } from 'lucide-react';\nimport { toast } from 'sonner';");
}

// 2. Replace alerts with toasts
file = file.replace(/alert\('System quota limit reached for today\. Bank resolution cannot be performed\.'\)/g, 'toast.error("System quota limit reached. Bank resolution paused.")');
file = file.replace(/alert\('Failed to resolve account'\)/g, 'toast.error("Failed to resolve account. Check number and bank.")');
file = file.replace(/alert\('Bank details saved successfully!'\)/g, 'toast.success("Bank details saved successfully!")');
file = file.replace(/alert\('Failed to save bank details'\)/g, 'toast.error("Failed to save bank details")');
file = file.replace(/alert\('Please verify your bank account first'\)/g, 'toast.error("Please verify your bank account first")');
file = file.replace(/alert\('Withdrawal amount must be at least ₦100'\)/g, 'toast.error("Withdrawal amount must be at least ₦100")');
file = file.replace(/alert\('Insufficient wallet balance'\)/g, 'toast.error("Insufficient wallet balance")');
file = file.replace(/alert\('Withdrawal request submitted successfully! Funds will be transferred to your verified bank account shortly\.'\)/g, 'toast.success("Withdrawal request submitted! Funds will be transferred shortly.")');
file = file.replace(/alert\("System quota limit reached for today\. Withdrawals cannot be processed at this time\."\)/g, 'toast.error("System quota limit reached for today.")');
file = file.replace(/alert\('Failed to submit withdrawal'\)/g, 'toast.error("Failed to submit withdrawal")');


fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Patched Wallet.tsx successfully!");

const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

if (!file.includes("import { toast } from 'sonner';")) {
  file = file.replace("import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle, Image as ImageIcon, Video, UserCheck, Smartphone, Settings, Banknote } from 'lucide-react';", "import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle, Image as ImageIcon, Video, UserCheck, Smartphone, Settings, Banknote } from 'lucide-react';\nimport { toast } from 'sonner';");
}

file = file.replace(/alert\(/g, "toast.info("); // Generic catch-all, but let's be careful
// Wait, replacing all alert( with toast( might break if it uses template literals that span lines, but toast() is a drop in replacement for alert().
// Let's do it safely:
file = file.replace(/alert\('Paystack configuration saved successfully!'\);/g, "toast.success('Paystack configuration saved successfully!');");
file = file.replace(/alert\('⚠️ System quota limit reached\. Paystack configuration saved locally in the browser session, but cloud sync is disabled\.'\);/g, "toast.warning('System quota reached. Paystack config saved locally only.');");
file = file.replace(/alert\('Error saving configuration: ' \+ \(error\?.message \|\| error\)\);/g, "toast.error('Error saving configuration: ' + (error?.message || error));");
file = file.replace(/alert\('Direct Paystack payouts require a live Paystack Secret Key configured in the Admin settings\.'\);/g, "toast.error('Direct Paystack payouts require a live Paystack Secret Key configured in settings.');");
file = file.replace(/alert\('Automated Paystack transfer initiated \.\.\. \(Simulated for ' \+ w.accountNumber \+ '\)'\);/g, "toast.success('Automated Paystack transfer initiated (Simulated for ' + w.accountNumber + ')');");
file = file.replace(/alert\('Failed to execute Paystack payout'\);/g, "toast.error('Failed to execute Paystack payout');");

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Patched AdminDashboard.tsx successfully!");

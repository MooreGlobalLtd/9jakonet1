const fs = require('fs');
let code = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

// Add whatsapp icon import
if (!code.includes('MessageCircle')) {
  code = code.replace("import { ShieldCheck, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight, X, Star, Upload, Info } from 'lucide-react';", "import { ShieldCheck, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight, X, Star, Upload, Info, MessageCircle } from 'lucide-react';");
}

// Add handleWhatsApp logic
const targetFunc = `  const handleRaiseDispute = async (job: EscrowContract) => {`;
const replacementFunc = `  const handleWhatsApp = async (artisanId: string) => {
    try {
      const docRef = await getDoc(doc(db, 'artisans', artisanId));
      if (docRef.exists()) {
        const data = docRef.data();
        if (data.whatsappNumber) {
          window.open(\`https://wa.me/\${data.whatsappNumber.replace(/\\D/g, '')}\`, '_blank');
        } else {
          toast.error("This artisan has not provided a WhatsApp number.");
        }
      } else {
        toast.error("Artisan profile not found.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error fetching WhatsApp contact.");
    }
  };

  const handleRaiseDispute = async (job: EscrowContract) => {`;
if(!code.includes('handleWhatsApp')) {
  code = code.replace(targetFunc, replacementFunc);
}

// Add UI button
const targetUI = `                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'in_progress' && (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Escrow Secured in Vault
                        </div>
                        <Button 
                          onClick={() => initiateReleaseOtp(job)} 
                          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                        >
                          Release Funds to Artisan
                        </Button>`;
const replacementUI = `                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'in_progress' && (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Escrow Secured in Vault
                        </div>
                        <div className="flex gap-2 w-full md:w-auto mt-1 mb-1">
                          <Button 
                            variant="outline"
                            onClick={() => handleWhatsApp(job.artisanId)} 
                            className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 font-semibold shadow-sm h-9"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                        <Button 
                          onClick={() => initiateReleaseOtp(job)} 
                          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm h-10"
                        >
                          Release Funds to Artisan
                        </Button>`;
if(!code.includes('handleWhatsApp(')) {
  code = code.replace(targetUI, replacementUI);
}

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', code);
console.log("JobsAndEscrow patched");

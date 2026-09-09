const fs = require('fs');

let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

// 1. Add toast import
if (!file.includes("import { toast } from 'sonner';")) {
  file = file.replace("import { PaystackButton } from 'react-paystack';", "import { PaystackButton } from 'react-paystack';\nimport { toast } from 'sonner';");
}

// 2. Replace alerts with toasts
file = file.replace(/alert\("System quota limit reached for today\. Withdrawals cannot be processed at this time\."\)/g, 'toast.error("System quota limit reached for today.")');
file = file.replace(/alert\('System quota limit reached for today\. Escrow could not be funded\.'\)/g, 'toast.error("System quota limit reached for today. Escrow could not be funded.")');
file = file.replace(/alert\('Failed to test escrow flow'\)/g, 'toast.error("Failed to test escrow flow")');
file = file.replace(/alert\(`🎉 Escrow Release Authorized! 9jaKonet Admin has been notified to disburse ₦\$\{artisanPayout.toLocaleString\(\)\} to \$\{job.artisanName\}'s bank account\. Please take a moment to rate your experience below\.`\)/g, 'toast.success(`🎉 Escrow Release Authorized! Admin notified to disburse ₦${artisanPayout.toLocaleString()}.`)');
file = file.replace(/alert\("Please select a star rating"\)/g, 'toast.error("Please select a star rating")');
file = file.replace(/alert\("Review submitted successfully"\)/g, 'toast.success("Review submitted successfully")');
file = file.replace(/alert\("Failed to submit review"\)/g, 'toast.error("Failed to submit review")');

// 3. Add Dispute logic
const disputeCode = `
  const handleRaiseDispute = async (job: EscrowContract) => {
    if (window.confirm("Are you sure you want to raise a dispute? Escrow funds will be locked until 9jaKonet Admin resolves the issue.")) {
      try {
        await updateDoc(doc(db, 'jobs', job.id), { status: 'disputed' });
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'disputed' } : j));
        toast.error("Job has been disputed. Admin will contact you shortly.");
      } catch (error) {
        toast.error("Failed to raise dispute");
      }
    }
  };
`;

if (!file.includes("handleRaiseDispute")) {
  file = file.replace("const initiateReleaseOtp", disputeCode + "\n  const initiateReleaseOtp");
}

// 4. Add Dispute button in the UI
// Look for the "Release Funds to Artisan" button block and add the Dispute button below it.
const releaseBlock = `<Button \n                          onClick={() => initiateReleaseOtp(job)} \n                          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"\n                        >\n                          Release Funds to Artisan\n                        </Button>`;

const replaceWith = releaseBlock + `
                        <Button 
                          onClick={() => handleRaiseDispute(job)} 
                          variant="outline"
                          className="w-full md:w-auto border-red-200 text-red-600 hover:bg-red-50 font-semibold shadow-sm mt-1"
                        >
                          Raise Dispute
                        </Button>
`;

file = file.replace(releaseBlock, replaceWith);

// Also add a Disputed status tag
const inProgressTag = `{user.role === 'artisan' && job.status === 'in_progress' && (`;
const replaceInProg = `{job.status === 'disputed' && (
                      <div className="text-sm text-red-700 font-bold bg-red-100 px-3 py-1.5 rounded-md border border-red-200 flex items-center gap-1.5 self-end">
                        <AlertCircle className="h-4 w-4" />
                        Status: Disputed (Funds Locked)
                      </div>
                    )}
                    
                    {user.role === 'artisan' && job.status === 'in_progress' && (`

file = file.replace(inProgressTag, replaceInProg);


fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);
console.log("Patched JobsAndEscrow.tsx successfully!");

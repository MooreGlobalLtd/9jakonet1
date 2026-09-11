const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add state for promptDialog
const stateTarget = `  const [confirmDialog, setConfirmDialog] = useState<{ message: string; action: () => void } | null>(null);`;
const stateReplacement = `  const [confirmDialog, setConfirmDialog] = useState<{ message: string; action: () => void } | null>(null);
  const [promptDialog, setPromptDialog] = useState<{ message: string; defaultText: string; action: (value: string) => void } | null>(null);`;
code = code.replace(stateTarget, stateReplacement);

// 2. Fix handleUpdateUserKycStatus
const funcTarget = `  const handleUpdateUserKycStatus = async (userId: string, newStatus: 'verified' | 'rejected') => {
    // 1. Validate rejection reason if rejected
    let rejectReason = '';
    if (newStatus === 'rejected') {
      const reason = prompt("Please enter the reason for declining this KYC:", "Unclear document photo or mismatched selfie");
      if (reason === null) return;
      if (!reason.trim()) {
        toast.info("You must provide a reason for declining.");
        return;
      }
      rejectReason = reason.trim();
    }`;

const funcReplacement = `  const handleUpdateUserKycStatus = async (userId: string, newStatus: 'verified' | 'rejected') => {
    if (newStatus === 'rejected') {
      setPromptDialog({
        message: "Please enter the reason for declining this KYC:",
        defaultText: "Unclear document photo or mismatched selfie",
        action: async (reason) => {
          if (!reason.trim()) {
            toast.info("You must provide a reason for declining.");
            return;
          }
          await processKycUpdate(userId, newStatus, reason.trim());
        }
      });
      return;
    }
    await processKycUpdate(userId, newStatus, '');
  };

  const processKycUpdate = async (userId: string, newStatus: 'verified' | 'rejected', rejectReason: string) => {`;
code = code.replace(funcTarget, funcReplacement);

// 3. Add Prompt Modal JSX right after Confirm Modal
const modalTarget = `      {/* General Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Confirm Action</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                confirmDialog.action();
                setConfirmDialog(null);
              }}>Confirm</Button>
            </div>
          </div>
        </div>
      )}`;

const modalReplacement = modalTarget + `

      {/* Prompt Dialog */}
      {promptDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Input Required</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">
              {promptDialog.message}
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const val = formData.get('promptValue') as string;
              promptDialog.action(val);
              setPromptDialog(null);
            }}>
              <input 
                name="promptValue"
                type="text" 
                defaultValue={promptDialog.defaultText}
                className="w-full border border-slate-300 rounded-md p-2 text-sm mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setPromptDialog(null)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Submit</Button>
              </div>
            </form>
          </div>
        </div>
      )}`;
      
if(code.includes(funcTarget)) {
  code = code.replace(modalTarget, modalReplacement);
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Prompt fixed");

const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// We add a general confirm state
file = file.replace(
  "const [userToDelete, setUserToDelete] = useState<User | null>(null);",
  "const [userToDelete, setUserToDelete] = useState<User | null>(null);\n  const [confirmDialog, setConfirmDialog] = useState<{ message: string; action: () => void } | null>(null);"
);

// 1. Reset single balance
file = file.replace(
  "if (!confirm(`Reset ${targetUser.displayName || targetUser.email}'s test wallet balance from ₦${(targetUser.walletBalance || 0).toLocaleString()} to ₦0?`)) return;",
  "// Removed confirm"
);
file = file.replace(
  "onClick={() => handleResetSingleUserBalance(u)}",
  "onClick={() => setConfirmDialog({ message: `Reset ${u.displayName || u.email}'s test wallet balance from ₦${(u.walletBalance || 0).toLocaleString()} to ₦0?`, action: () => handleResetSingleUserBalance(u) })}"
);

// 2. Clear all balances
file = file.replace(
  "if (!confirm(`This will clear test balances for ${toReset.length} users (including the ₦79,880 test balance) back to ₦0 for live production readiness. Proceed?`)) return;",
  "// Removed confirm"
);
file = file.replace(
  "onClick={handleClearTestBalances}",
  "onClick={() => setConfirmDialog({ message: `This will clear test balances for all users back to ₦0 for live production readiness. Proceed?`, action: () => handleClearTestBalances() })}"
);

// 3. Process withdrawal (this is tricky because it has variables from the map)
// Let's check how it's written in handleProcessWithdrawal
file = file.replace(
  "if (!confirm(`Trigger Paystack Transfer of ₦${w.amount.toLocaleString()} directly to:\\n${recipientName}\\n${w.bankName} (${w.accountNumber})?`)) {",
  "if (false) {"
);
// In the JSX, the button calls handleProcessWithdrawal(w)
// Wait, I can't easily replace the button onClick without a regex because w is the map variable.

const uiHTML = `
      {/* General Confirm Dialog */}
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
      )}
    </div>
  );
}
`;

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');
content = content.replace(/<\/div>\s*\)\s*;\s*}\s*$/, uiHTML);
fs.writeFileSync('src/pages/AdminDashboard.tsx', content);

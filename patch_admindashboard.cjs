const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Add deleteDoc to imports
if (!file.includes('deleteDoc')) {
  file = file.replace('setDoc }', 'setDoc, deleteDoc }');
}

// Add handleDeleteUser function
const deleteUserFunc = `
  const handleDeleteUser = async (targetUser: User) => {
    if (!confirm(\`Are you absolutely sure you want to permanently delete the account for \${targetUser.displayName || targetUser.email}? This action cannot be undone and will remove them from the platform.\`)) return;
    
    if (isQuotaExhausted()) {
      toast.info("System quota limit reached for today. Deletion is disabled.");
      return;
    }

    try {
      toast.loading("Deleting user data...", { id: 'deleteUser' });
      // Delete from users collection
      await deleteDoc(doc(db, 'users', targetUser.id));
      
      // If artisan, delete from artisans collection
      if (targetUser.role === 'artisan') {
         try { await deleteDoc(doc(db, 'artisans', targetUser.id)); } catch (e) {}
      }

      // We should probably also clean up state manually so they disappear immediately
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      
      toast.success(\`Successfully deleted user \${targetUser.displayName || targetUser.email}\`, { id: 'deleteUser' });
    } catch (err: any) {
      console.error(err);
      toast.error(\`Failed to delete user: \${err.message}\`, { id: 'deleteUser' });
    }
  };
`;

file = file.replace('const handleResetSingleUserBalance = async', deleteUserFunc + '\n  const handleResetSingleUserBalance = async');

// Add delete button in the UI
const uiAction = `{(u.walletBalance || 0) > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetSingleUserBalance(u)}
                                className="h-7 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-100"
                              >
                                Reset to ₦0
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-[11px] px-2">₦0 Clean</span>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(u)}
                              className="h-7 ml-2 text-[11px] border-red-200 text-red-600 hover:bg-red-50"
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>`;

file = file.replace(/\{\(u\.walletBalance \|\| 0\) > 0 \? \(\s*<Button[\s\S]*?Reset to ₦0\s*<\/Button>\s*\) : \(\s*<span className="text-slate-400 text-\[11px\]">₦0 Clean<\/span>\s*\)\}/, uiAction);

// Check if Trash2 is imported from lucide-react
if (!file.includes('Trash2')) {
  file = file.replace('Trash,', 'Trash, Trash2,');
  if (!file.includes('Trash2')) { // fallback if Trash wasn't there
    file = file.replace('X, ArrowUpRight', 'X, ArrowUpRight, Trash2');
  }
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Patched AdminDashboard.tsx");

const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetMakeAdmin = `  const handleResetSingleUserBalance = async (targetUser: User) => {`;
const newMakeAdmin = `  const handleMakeAdmin = async (targetUser: User) => {
    if (confirm(\`Are you sure you want to promote \${targetUser.displayName || targetUser.email} to Admin?\`)) {
      try {
        await updateDoc(doc(db, 'users', targetUser.id), {
          role: 'admin'
        });
        setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: 'admin' } : u));
        toast.success(\`\${targetUser.displayName || targetUser.email} is now an Admin.\`);
      } catch (err) {
        console.error("Error promoting user:", err);
        toast.error("Failed to promote user to Admin.");
      }
    }
  };

  const handleResetSingleUserBalance = async (targetUser: User) => {`;

if (code.includes(targetMakeAdmin) && !code.includes('handleMakeAdmin')) {
  code = code.replace(targetMakeAdmin, newMakeAdmin);
}

const targetButton = `                            {(u.walletBalance || 0) > 0 ? (
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
                            )}`;
const newButton = `                            {u.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakeAdmin(u)}
                                className="h-7 text-[11px] border-purple-200 text-purple-700 hover:bg-purple-50 mr-2"
                              >
                                Make Admin
                              </Button>
                            )}
                            {(u.walletBalance || 0) > 0 ? (
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
                            )}`;

if (code.includes(targetButton) && !code.includes('Make Admin')) {
  code = code.replace(targetButton, newButton);
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Admin panel patched with handleMakeAdmin");

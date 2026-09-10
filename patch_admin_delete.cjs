const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Add userToDelete state
file = file.replace(
  "const [previewModal, setPreviewModal] = useState<{ title: string; image: string; details?: string } | null>(null);",
  "const [previewModal, setPreviewModal] = useState<{ title: string; image: string; details?: string } | null>(null);\n  const [userToDelete, setUserToDelete] = useState<User | null>(null);"
);

// Replace handleDeleteUser logic
const deleteLogic = `
  const handleDeleteUser = async (targetUser: User) => {
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

      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      
      toast.success(\`Successfully deleted user \${targetUser.displayName || targetUser.email}\`, { id: 'deleteUser' });
    } catch (err: any) {
      console.error(err);
      toast.error(\`Failed to delete user: \${err.message}\`, { id: 'deleteUser' });
    } finally {
      setUserToDelete(null);
    }
  };
`;

file = file.replace(
  /const handleDeleteUser = async \(targetUser: User\) => \{[\s\S]*?\} catch \(err: any\) \{[\s\S]*?\}[\s\S]*?\};/,
  deleteLogic
);

// We need to change the onClick in the button to setUserToDelete(u)
file = file.replace(
  /onClick=\{\(\) => handleDeleteUser\(u\)\}/,
  "onClick={() => setUserToDelete(u)}"
);

// Add custom modal at the end of the file (before final </div>)
const modalHtml = `
      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you absolutely sure you want to permanently delete the account for <span className="font-semibold text-slate-900">{userToDelete.displayName || userToDelete.email}</span>? This action cannot be undone and will remove them from the platform.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setUserToDelete(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteUser(userToDelete)}>Delete Account</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
file = file.replace(/<\/div>\s*\)\s*;\s*}\s*$/, modalHtml);

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);

const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add isSuperAdmin variable
const stateVarsEnd = `  // Drilldown states for interactive stat cards`;
const newSuperAdminVar = `  const isSuperAdmin = user?.email === 'ayorindesamuel705@gmail.com' || user?.email === 'info@mooregloballtd.online';
  
  // Drilldown states for interactive stat cards`;

if(code.includes(stateVarsEnd) && !code.includes('const isSuperAdmin =')) {
  code = code.replace(stateVarsEnd, newSuperAdminVar);
}

// 2. Add handleRevokeAdmin
const makeAdminBlock = `  const handleMakeAdmin = async (targetUser: User) => {`;
const revokeAdminBlock = `  const handleRevokeAdmin = async (targetUser: User) => {
    if (confirm(\`Are you sure you want to revoke Admin rights from \${targetUser.displayName || targetUser.email}?\`)) {
      try {
        const originalRole = artisans.some(a => a.userId === targetUser.id) ? 'artisan' : 'customer';
        await updateDoc(doc(db, 'users', targetUser.id), {
          role: originalRole
        });
        setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: originalRole } : u));
        toast.success(\`\${targetUser.displayName || targetUser.email} is no longer an Admin.\`);
      } catch (err) {
        console.error("Error revoking admin:", err);
        toast.error("Failed to revoke admin rights.");
      }
    }
  };

  const handleMakeAdmin = async (targetUser: User) => {`;

if (code.includes(makeAdminBlock) && !code.includes('handleRevokeAdmin')) {
  code = code.replace(makeAdminBlock, revokeAdminBlock);
}

// 3. Update the buttons in the table
const buttonsTarget = `                            {u.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakeAdmin(u)}
                                className="h-7 text-[11px] border-purple-200 text-purple-700 hover:bg-purple-50 mr-2"
                              >
                                Make Admin
                              </Button>
                            )}`;
                            
const buttonsReplacement = `                            {u.role !== 'admin' && isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakeAdmin(u)}
                                className="h-7 text-[11px] border-purple-200 text-purple-700 hover:bg-purple-50 mr-2"
                              >
                                Make Admin
                              </Button>
                            )}
                            {u.role === 'admin' && isSuperAdmin && u.email !== user?.email && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeAdmin(u)}
                                className="h-7 text-[11px] border-orange-200 text-orange-700 hover:bg-orange-50 mr-2"
                                title="Demote back to normal user"
                              >
                                Revoke Admin
                              </Button>
                            )}`;

if (code.includes(buttonsTarget) && !code.includes('Revoke Admin')) {
  code = code.replace(buttonsTarget, buttonsReplacement);
}

// 4. Wrap Configuration card in isSuperAdmin
const configCardStart = `{/* Paystack Gateway Configuration */}
        <Card className="md:col-span-2 border-emerald-200">`;
const configCardReplacement = `{/* Paystack Gateway Configuration */}
        {isSuperAdmin && (
        <Card className="md:col-span-2 border-emerald-200">`;

const configCardEnd = `            </div>
          </CardContent>
        </Card>
      </div>`;
const configCardEndReplacement = `            </div>
          </CardContent>
        </Card>
        )}
      </div>`;

if(code.includes(configCardStart)) {
  code = code.replace(configCardStart, configCardReplacement);
  code = code.replace(configCardEnd, configCardEndReplacement);
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("SuperAdmin logic, Revoke Admin, and Config hiding applied.");

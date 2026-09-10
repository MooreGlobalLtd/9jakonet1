const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

// Calculate pendingBalance dynamically
file = file.replace(
  "const isCustomer = user.role === 'customer';",
  "const isCustomer = user.role === 'customer';\n  const pendingBalance = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);\n  const displayBalance = isCustomer ? (user.walletBalance || 0) : pendingBalance;"
);

// Replace display references
file = file.replace(
  "₦{(user.walletBalance || 0).toLocaleString()}",
  "₦{displayBalance.toLocaleString()}"
);

file = file.replace(
  "{(user.walletBalance || 0) > 0 && (",
  "{displayBalance > 0 && ("
);

// When resetting test balance, also reject all pending withdrawals so the calculated balance drops to 0.
const resetLogic = `await updateDoc(doc(db, 'users', user.id), { walletBalance: 0 });
      // Also clear pending withdrawals so the calculated balance resets
      const qW = query(collection(db, 'withdrawals'), where('userId', '==', user.id), where('status', '==', 'pending'));
      const snapW = await getDocs(qW);
      for (const wDoc of snapW.docs) {
        await updateDoc(wDoc.ref, { status: 'rejected' });
      }`;

file = file.replace(
  "await updateDoc(doc(db, 'users', user.id), { walletBalance: 0 });",
  resetLogic
);

fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Patched Wallet.tsx for pending balance");

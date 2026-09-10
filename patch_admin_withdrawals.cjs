const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const importReplacement = `import { collection, query, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';`;
if (!file.includes('getDoc } from')) {
    file = file.replace(/import \{ collection, query, getDocs, updateDoc, doc, setDoc \} from 'firebase\/firestore';/, importReplacement);
}

const rejectFunc = `
  const handleRejectWithdrawal = async (w: Withdrawal) => {
    if (!confirm('Are you sure you want to reject this withdrawal? The funds will be refunded to the user\\'s wallet.')) return;
    try {
      // Refund wallet
      const userRef = doc(db, 'users', w.userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentBalance = userDoc.data().walletBalance || 0;
        await updateDoc(userRef, {
          walletBalance: currentBalance + w.amount
        });
      }
      
      // Update withdrawal status
      await updateDoc(doc(db, 'withdrawals', w.id), {
        status: 'rejected',
        updatedAt: Date.now()
      });
      toast.success('Withdrawal rejected and refunded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject withdrawal');
    }
  };

  const markWithdrawalComplete = async (withdrawalId: string) => {`;

file = file.replace(/const markWithdrawalComplete = async \(withdrawalId: string\) => \{/, rejectFunc);
file = file.replace(/onClick=\{\(\) => rejectWithdrawal\(w\)\}/g, 'onClick={() => handleRejectWithdrawal(w)}');

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);

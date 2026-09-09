const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const oldFuncRegex = /const handleUpdateUserKycStatus = async [\s\S]*?alert\('ERROR: ' \+ \(err\.message \|\| err\)\);\n    \}\n  \};/m;

const newFunc = `const handleUpdateUserKycStatus = async (userId: string, newStatus: 'verified' | 'rejected') => {
    // 1. Validate rejection reason if rejected
    let rejectReason = '';
    if (newStatus === 'rejected') {
      const reason = prompt("Please enter the reason for declining this KYC:", "Unclear document photo or mismatched selfie");
      if (reason === null) return;
      if (!reason.trim()) {
        alert("You must provide a reason for declining.");
        return;
      }
      rejectReason = reason.trim();
    }

    // 2. Prepare payload
    const payload = {
      isKycVerified: newStatus === 'verified',
      kyc: {
        status: newStatus,
        verifiedAt: Date.now(),
        rejectReason: newStatus === 'rejected' ? rejectReason : ''
      }
    };

    // 3. OPTIMISTIC UI UPDATE - INSTANT FEEDBACK
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      isKycVerified: newStatus === 'verified',
      kyc: { ...(u.kyc || {}), ...payload.kyc }
    } as any : u));

    // 4. FIREBASE SYNC
    try {
      // Direct setDoc with merge is completely safe.
      await setDoc(doc(db, 'users', userId), payload, { merge: true });

      // Background updates for logs and artisan profile
      setDoc(doc(db, 'kyc_verifications', userId), {
          status: newStatus,
          verifiedAt: Date.now()
      }, { merge: true }).catch(console.warn);

      getDoc(doc(db, 'artisans', userId)).then((artDoc: any) => {
        if (artDoc.exists()) {
          setDoc(doc(db, 'artisans', userId), {
              verificationStatus: newStatus === 'verified' ? 'verified' : 'pending'
          }, { merge: true });
        }
      }).catch(console.warn);

      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.email) {
        sendEmail({
          to: targetUser.email,
          subject: newStatus === 'verified' ? 'Congratulations! Your 9jaKonet Identity is Verified' : '9jaKonet KYC Verification Update',
          html: newStatus === 'verified' 
            ? \`<h2>Identity Verified!</h2><p>Hi \${targetUser.displayName || 'User'},</p><p>Your identity documents and live selfie have been reviewed and approved by the 9jaKonet administration! Your account now proudly holds the official <strong>Verified Shield</strong>.</p>\`
            : \`<h2>KYC Review Notice</h2><p>Hi \${targetUser.displayName || 'User'},</p><p>Your recent verification submission was declined.</p><p><strong>Reason:</strong> \${rejectReason}</p><p>Please log in to 9jaKonet and re-submit clear documents and a live camera selfie.</p>\`
        }).catch(console.warn);
      }
    } catch (err: any) {
      console.error("KYC Update Error:", err);
      alert('Background Sync Error: ' + (err.message || err));
      // Revert UI if DB write failed
      fetchData();
    }
  };`;

if (oldFuncRegex.test(code)) {
  code = code.replace(oldFuncRegex, newFunc);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
  console.log("Success");
} else {
  console.log("Could not match regex");
}

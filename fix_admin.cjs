const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Replace the entire handleUpdateUserKycStatus function
const oldFuncRegex = /const handleUpdateUserKycStatus = async [\s\S]*?alert\(`✅ Updated KYC verification status[\s\S]*?\}\n  \};/m;

const newFunc = `const handleUpdateUserKycStatus = async (userId: string, newStatus: 'verified' | 'rejected') => {
    if (isQuotaExhausted()) {
      alert("System quota limit reached for today. KYC updates are disabled.");
      return;
    }

    let rejectReason = '';
    if (newStatus === 'rejected') {
      const reason = prompt("Please enter the reason for declining this KYC (this will be shown to the user):", "Unclear document photo or mismatched selfie");
      if (reason === null) return; // Cancelled
      if (!reason.trim()) {
        alert("You must provide a reason for declining.");
        return;
      }
      rejectReason = reason.trim();
    }

    try {
      const targetUser = users.find(u => u.id === userId);
      const existingKyc = targetUser?.kyc || {};
      
      const newKycData = {
        ...existingKyc,
        status: newStatus,
        verifiedAt: Date.now()
      };
      
      if (newStatus === 'rejected') {
        newKycData.rejectReason = rejectReason;
      } else {
        newKycData.rejectReason = ''; // Clear reason if verified
      }

      const kycUpdatePayload = {
        isKycVerified: newStatus === 'verified',
        kyc: newKycData
      };

      // Direct Firebase update without timeout wrapper to ensure it completes or fails loudly
      await updateDoc(doc(db, 'users', userId), kycUpdatePayload);

      // Also update kyc_verifications record
      try {
        await setDoc(doc(db, 'kyc_verifications', userId), {
            status: newStatus,
            verifiedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.warn('KYC verifications log sync notice:', e);
      }

      // If this user is an artisan, synchronize their artisan verification status
      try {
        const artisanDoc: any = await getDoc(doc(db, 'artisans', userId));
        if (artisanDoc && artisanDoc.exists()) {
          await updateDoc(doc(db, 'artisans', userId), {
              verificationStatus: newStatus === 'verified' ? 'verified' : 'pending'
          });
        }
      } catch (e) {
        console.warn('Artisan sync notice:', e);
      }

      if (targetUser?.email) {
        sendEmail({
          to: targetUser.email,
          subject: newStatus === 'verified' ? 'Congratulations! Your 9jaKonet Identity is Verified' : '9jaKonet KYC Verification Update',
          html: newStatus === 'verified' 
            ? \`<h2>Identity Verified!</h2><p>Hi \${targetUser.displayName || 'User'},\}</p><p>Your identity documents and live selfie have been reviewed and approved by the 9jaKonet administration! Your account now proudly holds the official <strong>Verified Shield</strong>.</p>\`
            : \`<h2>KYC Review Notice</h2><p>Hi \${targetUser.displayName || 'User'},\}</p><p>Your recent verification submission was declined.</p><p><strong>Reason:</strong> \${rejectReason}</p><p>Please log in to 9jaKonet and re-submit clear documents and a live camera selfie.</p>\`
        }).catch(err => console.warn('Email notice error:', err));
      }

      // Refresh data from server to ensure perfect sync
      await fetchData();
      
      alert(\`✅ Updated KYC verification status to "\${newStatus}" for \${targetUser?.displayName || 'user'}.\`);
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('quota')) {
        markQuotaExhausted();
        alert("System quota limit reached for today. KYC updates are disabled.");
      } else {
        console.error('Update Error:', err);
        alert('Error updating KYC status: ' + err.message);
      }
    }
  };`;

code = code.replace(oldFuncRegex, newFunc);
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);

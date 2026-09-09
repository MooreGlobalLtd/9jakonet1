const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const oldFuncRegex = /const handleUpdateUserKycStatus = async [\s\S]*?alert\(`✅ DATABASE VERIFIED[\s\S]*?\}\n  \};/m;

const newFunc = `const handleUpdateUserKycStatus = async (userId: string, newStatus: 'verified' | 'rejected') => {
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
      
      const payload = {
        isKycVerified: newStatus === 'verified',
        kyc: {
          status: newStatus,
          verifiedAt: Date.now(),
          rejectReason: newStatus === 'rejected' ? rejectReason : ''
        }
      };

      // 1. Update users collection directly
      await setDoc(doc(db, 'users', userId), payload, { merge: true });

      // Also update kyc_verifications record
      try {
        await setDoc(doc(db, 'kyc_verifications', userId), {
            status: newStatus,
            verifiedAt: Date.now()
        }, { merge: true });
      } catch (e) {}

      // If this user is an artisan, synchronize their artisan verification status
      try {
        const artisanDoc: any = await getDoc(doc(db, 'artisans', userId));
        if (artisanDoc && artisanDoc.exists()) {
          await setDoc(doc(db, 'artisans', userId), {
              verificationStatus: newStatus === 'verified' ? 'verified' : 'pending'
          }, { merge: true });
        }
      } catch (e) {}

      if (targetUser?.email) {
        sendEmail({
          to: targetUser.email,
          subject: newStatus === 'verified' ? 'Congratulations! Your 9jaKonet Identity is Verified' : '9jaKonet KYC Verification Update',
          html: newStatus === 'verified' 
            ? \`<h2>Identity Verified!</h2><p>Hi \${targetUser.displayName || 'User'},</p><p>Your identity documents and live selfie have been reviewed and approved by the 9jaKonet administration! Your account now proudly holds the official <strong>Verified Shield</strong>.</p>\`
            : \`<h2>KYC Review Notice</h2><p>Hi \${targetUser.displayName || 'User'},</p><p>Your recent verification submission was declined.</p><p><strong>Reason:</strong> \${rejectReason}</p><p>Please log in to 9jaKonet and re-submit clear documents and a live camera selfie.</p>\`
        }).catch(e => console.log(e));
      }

      alert(\`SUCCESS: Updated KYC to \${newStatus} for \${targetUser?.displayName}\`);
      await fetchData(); // Force refresh to show DB truth
    } catch (err: any) {
      alert('ERROR: ' + (err.message || err));
    }
  };`;

code = code.replace(oldFuncRegex, newFunc);
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);

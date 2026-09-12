const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

code = code.replace(
  "}).filter(a => a.user && a.user.isKycVerified === true); // Only show if user exists AND is KYC verified",
  "}).filter(a => a.user && (a.verificationStatus === 'verified' || a.user.isKycVerified === true || (a.user.kyc && a.user.kyc.status === 'verified'))); // Only show fully verified artisans"
);

fs.writeFileSync('src/pages/Explore.tsx', code);
console.log('Fixed Explore.tsx');

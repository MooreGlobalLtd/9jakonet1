const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

code = code.replace(
  "const showKycPrompt = user && !user.isKycVerified && location.pathname !== '/verify-kyc';",
  "const showKycPrompt = user && !user.isKycVerified && user?.kyc?.status !== 'verified' && user?.kyc?.status !== 'pending' && location.pathname !== '/verify-kyc';"
);

fs.writeFileSync('src/components/layout/AppLayout.tsx', code);

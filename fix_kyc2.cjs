const fs = require('fs');
let code = fs.readFileSync('src/pages/VerificationKYC.tsx', 'utf-8');

code = code.replace(
  "if (user?.kyc?.status === 'rejected' && !isSuccess && !isRetrying) {",
  "if (user?.kyc?.status === 'rejected' && !isSuccess && !isRetrying) {\n    const rejectReason = user?.kyc?.rejectReason || 'The submitted documents or selfie were unclear, invalid, or mismatched.';"
);

code = code.replace(
  "{user.kyc.rejectReason || \"The submitted documents or selfie were unclear, invalid, or mismatched.\"}",
  "{rejectReason}"
);

fs.writeFileSync('src/pages/VerificationKYC.tsx', code);

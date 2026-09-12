const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

code = code.replace(
  "}).filter(a => a.user); // Only show if user data exists",
  "}).filter(a => a.user && a.user.isKycVerified === true); // Only show if user exists AND is KYC verified"
);

fs.writeFileSync('src/pages/Explore.tsx', code);
console.log('Fixed Explore.tsx');

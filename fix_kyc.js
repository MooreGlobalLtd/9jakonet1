const fs = require('fs');
let code = fs.readFileSync('src/pages/VerificationKYC.tsx', 'utf-8');

code = code.replace(
  'const [isSuccess, setIsSuccess] = useState(false);',
  'const [isSuccess, setIsSuccess] = useState(false);\n  const [isRetrying, setIsRetrying] = useState(false);'
);

code = code.replace(
  "if (user?.kyc?.status === 'rejected' && !isSuccess) {",
  "if (user?.kyc?.status === 'rejected' && !isSuccess && !isRetrying) {"
);

code = code.replace(
  "onClick={() => setUser({ ...user, kyc: { ...user.kyc, status: undefined } } as any)}",
  "onClick={() => setIsRetrying(true)}"
);

fs.writeFileSync('src/pages/VerificationKYC.tsx', code);

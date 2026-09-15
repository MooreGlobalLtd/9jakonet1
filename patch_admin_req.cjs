const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  'body: JSON.stringify({\n            publicKey: cleanPublic,\n            secretKey: cleanSecret\n          })',
  'body: JSON.stringify({\n            publicKey: cleanPublic,\n            secretKey: cleanSecret,\n            resendKey: cleanResend\n          })'
);

content = content.replace(
  'body: JSON.stringify({\n              publicKey: cleanPublic,\n              secretKey: cleanSecret\n            })',
  'body: JSON.stringify({\n              publicKey: cleanPublic,\n              secretKey: cleanSecret,\n              resendKey: cleanResend\n            })'
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);

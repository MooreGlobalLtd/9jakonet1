const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf-8');

file = file.replace(
  "from: '9jaKonet <onboarding@resend.dev>', // Free tier default, must be onboarding@resend.dev until custom domain is verified",
  "from: '9jaKonet <info@mooregloballtd.online>',"
);

fs.writeFileSync('server.ts', file);
console.log("Patched server.ts for production email");

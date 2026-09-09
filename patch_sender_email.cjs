const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf-8');

// The free tier of Resend only allows sending from 'onboarding@resend.dev' to the verified email address.
// If the user tries to send from their custom domain without verifying it on Resend, the API call fails silently or throws an error.

file = file.replace(/from: '9jaKonet <info@mooregloballtd\.online>',/, "from: '9jaKonet <onboarding@resend.dev>', // Free tier default, must be onboarding@resend.dev until custom domain is verified");

fs.writeFileSync('server.ts', file);
console.log("Patched server.ts sender email");

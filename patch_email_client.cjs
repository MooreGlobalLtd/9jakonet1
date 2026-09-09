const fs = require('fs');
let file = fs.readFileSync('src/lib/email.ts', 'utf-8');

file = file.replace("'Content-Type': 'application/json',", "'Content-Type': 'application/json',\n        'x-resend-api-key': localStorage.getItem('resend_api_key') || '',");
fs.writeFileSync('src/lib/email.ts', file);
console.log("Patched email.ts");

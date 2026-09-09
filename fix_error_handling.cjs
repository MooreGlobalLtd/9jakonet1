const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const oldRegex = /console\.error\("KYC Update Error:", err\);\n\s*alert\('Background Sync Error: ' \+ \(err\.message \|\| err\)\);/m;
const newCode = `console.error("KYC Update Error:", err);
      if (err.message === "FIREBASE_TIMEOUT") {
        alert("⚠️ Connection Timeout: Your browser's adblocker or the AI Studio Sandbox limits are blocking Firebase saves!\\n\\nTo fix this for good, follow the YouTube tutorial you linked to set up your own Firebase Project and paste the keys in the app settings.");
      } else {
        alert('Background Sync Error: ' + (err.message || err));
      }`;

if (oldRegex.test(code)) {
  code = code.replace(oldRegex, newCode);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
  console.log("Replaced error block");
} else {
  console.log("Not found error block");
}

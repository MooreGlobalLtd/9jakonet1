const fs = require('fs');

let file = fs.readFileSync('server.ts', 'utf-8');

const getResendOld = `
function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}`;

const getResendNew = `
function getResend(req?: express.Request) {
  const headerKey = req?.headers['x-resend-api-key'] as string;
  const activeKey = (headerKey && headerKey.trim()) ? headerKey.trim() : process.env.RESEND_API_KEY;
  
  if (activeKey) {
    return new Resend(activeKey);
  }
  return null;
}`;

file = file.replace(getResendOld.trim(), getResendNew.trim());
file = file.replace("const resend = getResend();", "const resend = getResend(req);");

fs.writeFileSync('server.ts', file);
console.log("Patched server.ts for resend key");

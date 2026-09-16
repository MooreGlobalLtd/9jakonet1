const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

const target = `                onClick={async () => {
                  toast.info("Resending OTP code...");
                  const emailResult = await sendEmail({`;

const replace = `                onClick={async () => {
                  alert("TEST MODE RESEND CODE: " + generatedOtp);
                  return;
                  toast.info("Resending OTP code...");
                  const emailResult = await sendEmail({`;
                  
content = content.replace(target, replace);
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

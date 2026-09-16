const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

// Patch initiateReleaseOtp
const initTarget = `      if (targetEmail) {
        await sendEmail({
          to: targetEmail,
          subject: \`🔒 9jaKonet Escrow Release Authorization Code: \${code}\`,
          html: \`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">`;

const initReplace = `      if (targetEmail) {
        const emailResult = await sendEmail({
          to: targetEmail,
          subject: \`🔒 9jaKonet Escrow Release Authorization Code: \${code}\`,
          html: \`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">`;

content = content.replace(initTarget, initReplace);

const initTarget2 = `          \`
        });
      }
    } catch (e) {`;

const initReplace2 = `          \`
        });
        
        if (emailResult?.simulated) {
          toast.success(\`TEST MODE: Your OTP is \${code}\`, { duration: 10000 });
        }
      }
    } catch (e) {`;

content = content.replace(initTarget2, initReplace2);


// Patch Resend Code
const resendTarget = `                onClick={async () => {
                  toast.info("Resending OTP code...");
                  await sendEmail({
                    to: user?.email || '',
                    subject: '🔒 Resend: Escrow Release Authorization Code',
                    html: \`
                      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">`;

const resendReplace = `                onClick={async () => {
                  toast.info("Resending OTP code...");
                  const emailResult = await sendEmail({
                    to: user?.email || '',
                    subject: '🔒 Resend: Escrow Release Authorization Code',
                    html: \`
                      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">`;

content = content.replace(resendTarget, resendReplace);

const resendTarget2 = `                      </div>
                    \`
                  });
                  toast.success("A new code has been sent to your email!");
                }}`;

const resendReplace2 = `                      </div>
                    \`
                  });
                  if (emailResult?.simulated) {
                    toast.success(\`TEST MODE: Your OTP is \${generatedOtp}\`, { duration: 10000 });
                  } else {
                    toast.success("A new code has been sent to your email!");
                  }
                }}`;

content = content.replace(resendTarget2, resendReplace2);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

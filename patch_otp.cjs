const fs = require('fs');

let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

// The block to replace:
const oldHelper = `
            {/* Helper code reveal for seamless testing or offline delivery */}
            <div className="mb-5 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Didn't see the email?
              </span>
              <button
                type="button"
                onClick={() => setEnteredOtp(generatedOtp)}
                className="text-emerald-600 font-semibold hover:underline"
              >
                Auto-fill Code ({generatedOtp})
              </button>
            </div>
`;

const newHelper = `
            {/* Resend OTP */}
            <div className="mb-5 flex items-center justify-start text-xs">
              <span className="text-slate-500 mr-2">
                Didn't see the email?
              </span>
              <button
                type="button"
                onClick={async () => {
                  toast.info("Resending OTP code...");
                  await sendEmail({
                    to: user?.email || '',
                    subject: '🔒 Resend: Escrow Release Authorization Code',
                    html: \`
                      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                        <h2 style="color: #0f172a;">Escrow Authorization Code</h2>
                        <p>You requested a new code for the job: <strong>\${otpModalJob.title}</strong>.</p>
                        <p>Your 6-digit release code is:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; margin: 20px 0;">\${generatedOtp}</div>
                        <p style="color: #64748b; font-size: 13px;">Never share this code with anyone. 9jaKonet admins will never ask for this code.</p>
                      </div>
                    \`
                  });
                  toast.success("A new code has been sent to your email!");
                }}
                className="text-emerald-600 font-semibold hover:underline"
              >
                Resend Code
              </button>
            </div>
`;

file = file.replace(oldHelper.trim(), newHelper.trim());

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);
console.log("Patched OTP Helper");

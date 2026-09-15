const fs = require('fs');
let content = fs.readFileSync('src/pages/Register.tsx', 'utf8');

if (!content.includes("import { sendEmail }")) {
  content = content.replace("import { Button }", "import { sendEmail } from '../lib/email';\nimport { Button }");
}

const customEmailLogic = `
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      // Send Custom Welcome Email based on role
      try {
        if (role === 'artisan') {
          const artisanHtml = \`
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #047857; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to 9jaKonet! 👑</h1>
              </div>
              <div style="padding: 30px; color: #334155; line-height: 1.6;">
                <p>Hello \${fullName.trim()},</p>
                <p>Welcome to Nigeria's safest artisan marketplace! You are now part of a network where trust comes first.</p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #b45309;">🔥 LAUNCH PROMO: 0% COMMISSION</h3>
                  <p style="margin: 0;">For a limited time, you keep <strong>100% of the money you earn</strong> on 9jaKonet. No platform cuts. Period.</p>
                </div>
                <h3 style="color: #0f172a;">Next Steps to Start Earning:</h3>
                <ol style="margin-bottom: 25px;">
                  <li><strong>Verify Your Email:</strong> Check your inbox for a verification link to confirm this email address.</li>
                  <li><strong>Complete KYC:</strong> Log into your dashboard and upload your government ID. <em>(Customers only hire Verified Artisans!)</em></li>
                  <li><strong>Get Hired:</strong> Once verified, customers in your area can find you and book you securely through Escrow.</li>
                </ol>
                <a href="https://www.9jakonet.com" style="display: block; width: 100%; text-align: center; background-color: #047857; color: white; padding: 14px 0; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Your Dashboard</a>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                <p>9jaKonet | Safe Escrow & Verified Artisans</p>
                <p>Support: support@9jakonet.com | Phone: 09021171832</p>
              </div>
            </div>
          \`;
          await sendEmail({
            to: email.trim(),
            subject: "Welcome to 9jaKonet! 👑 (0% Commission Promo)",
            html: artisanHtml
          });
        } else {
          const customerHtml = \`
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to 9jaKonet! 🚀</h1>
              </div>
              <div style="padding: 30px; color: #334155; line-height: 1.6;">
                <p>Hello \${fullName.trim()},</p>
                <p>Welcome to Nigeria's safest artisan marketplace. Say goodbye to artisans running away with your money.</p>
                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #047857;">🔒 100% SECURE ESCROW</h3>
                  <p style="margin: 0;">Your money stays safely locked in Escrow. The artisan <strong>only</strong> gets paid after the job is completed to your satisfaction.</p>
                </div>
                <h3 style="color: #0f172a;">How it works:</h3>
                <ol style="margin-bottom: 25px;">
                  <li><strong>Find a Pro:</strong> Search our network of KYC-verified professionals (Plumbers, Electricians, Mechanics, etc).</li>
                  <li><strong>Fund Escrow:</strong> Pay securely upfront. The artisan knows the money is there, so they show up fast!</li>
                  <li><strong>Release Funds:</strong> Only tap "Release Funds" when you are 100% satisfied with the work.</li>
                </ol>
                <a href="https://www.9jakonet.com" style="display: block; width: 100%; text-align: center; background-color: #0f172a; color: white; padding: 14px 0; text-decoration: none; border-radius: 6px; font-weight: bold;">Find an Artisan Now</a>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                <p>9jaKonet | Safe Escrow & Verified Artisans</p>
                <p>Support: support@9jakonet.com | Phone: 09021171832</p>
              </div>
            </div>
          \`;
          await sendEmail({
            to: email.trim(),
            subject: "Welcome to 9jaKonet! 🔒 (Your Money is Safe)",
            html: customerHtml
          });
        }
      } catch (emailErr) {
        console.error("Welcome email failed to send, but registration succeeded.", emailErr);
      }
`;

content = content.replace("await setDoc(doc(db, 'users', userCredential.user.uid), newUser);", customEmailLogic);
fs.writeFileSync('src/pages/Register.tsx', content);

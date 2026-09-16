const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

// Fix the modal display math for 0% Promo
const modalTarget = `<div className="flex justify-between text-slate-500 text-xs">
                <span>Platform Commission (0% PROMO):</span>
                <span>₦{Math.round((otpModalJob.amount || 0) * 0.10).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-700">
                <span>Artisan Net Payout (100% PROMO):</span>
                <span>₦{Math.round((otpModalJob.amount || 0) * 0.90).toLocaleString()}</span>
              </div>`;

const modalReplacement = `<div className="flex justify-between text-slate-500 text-xs">
                <span>Platform Commission (0% PROMO):</span>
                <span className="line-through text-red-400 mr-2">₦{Math.round((otpModalJob.amount || 0) * 0.10).toLocaleString()}</span>
                <span>₦0</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-700">
                <span>{otpModalJob.contractType === 'product' ? 'Seller' : 'Artisan'} Net Payout:</span>
                <span>₦{(otpModalJob.amount || 0).toLocaleString()}</span>
              </div>`;

content = content.replace(modalTarget, modalReplacement);

// Fix the email being sent for the OTP Modal
const emailMathTarget = `The ₦\${Math.round((job.amount || 0) * 0.9).toLocaleString()} payout will be queued`;
const emailMathReplace = `The ₦\${(job.amount || 0).toLocaleString()} payout will be queued`;

content = content.replace(emailMathTarget, emailMathReplace);

// We also need to fix the OTP not sending logic in initiateReleaseOtp
const otpLogicTarget = `if (user?.email) {
        await sendEmail({
          to: user.email,`;

const otpLogicReplace = `
      // Ensure we get the correct email from DB if user object is stale
      let targetEmail = user?.email;
      if (!targetEmail) {
         const userDoc = await getDoc(doc(db, 'users', user!.id));
         targetEmail = userDoc.data()?.email;
      }
      
      if (targetEmail) {
        await sendEmail({
          to: targetEmail,`;

content = content.replace(otpLogicTarget, otpLogicReplace);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

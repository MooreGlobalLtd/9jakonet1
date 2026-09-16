const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

const target = `  const initiateReleaseOtp = async (job: EscrowContract) => {
    setOtpModalJob(job);`;

const replacement = `  const initiateReleaseOtp = async (job: EscrowContract) => {
    // FORCE BYPASS TOAST - USE BROWSER ALERT
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    alert("TEST MODE CODE: " + code);
    setGeneratedOtp(code);
    setOtpModalJob(job);
    setEnteredOtp('');
    setOtpError('');
    return; // Stop the rest of the function for now to guarantee the modal shows up without hanging
`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

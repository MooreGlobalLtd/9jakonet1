const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

const target = `    setOtpError('');
    return; // Stop the rest of the function for now to guarantee the modal shows up without hanging

    setEnteredOtp('');
    setOtpError('');
    setOtpSending(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);`;

const replace = `    setOtpError('');
    return; // Stop the rest of the function for now to guarantee the modal shows up without hanging

    setEnteredOtp('');
    setOtpError('');
    setOtpSending(true);

    // const code = Math.floor(100000 + Math.random() * 900000).toString();
    // setGeneratedOtp(code);`;
    
content = content.replace(target, replace);
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

const fs = require('fs');
let code = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');
code = code.replace("{job.status.replace('_', ' ')}", "{(job.status || 'unknown').replace('_', ' ')}");
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', code);
console.log('Fixed job.status');

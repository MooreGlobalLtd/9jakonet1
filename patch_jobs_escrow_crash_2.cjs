const fs = require('fs');
let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');
file = file.replace(/job\.amount \* 0\.9\)\.toLocaleString\(\)/g, "(job.amount || 0) * 0.9).toLocaleString()");
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);

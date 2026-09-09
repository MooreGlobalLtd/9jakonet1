const fs = require('fs');

let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

file = file.replace(/\{\(!paystackPublicKey/g, "(!paystackPublicKey");
file = file.replace(/\/>\n\s*?\)\}\n\s*?\)\}/g, "/>\n                    )\n                    )}"); // fix the closing braces

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);
console.log("Syntax fixed");

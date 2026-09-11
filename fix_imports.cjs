const fs = require('fs');
let code = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');
code = code.replace("import { ShieldCheck", "import { MessageCircle, ShieldCheck");
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', code);
console.log('Fixed imports');

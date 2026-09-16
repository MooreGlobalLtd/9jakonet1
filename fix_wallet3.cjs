const fs = require('fs');
let content = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

const lines = content.split('\\n');

// Find and clear out the bad lines
// 467 and 471
lines[466] = ''; // line 467 is index 466
lines[470] = ''; // line 471 is index 470
lines[476] = ''; // line 477: {!isCustomer && (
lines[635] = ''; // find closing for History Sections

// Wait, where is the closing bracket for History Sections?

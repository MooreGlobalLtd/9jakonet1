const fs = require('fs');
let content = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');
const lines = content.split('\\n');

// 467
lines[466] = ''; 
// 471
lines[470] = ''; 
// 477: {!isCustomer && (
lines[476] = ''; 
// 605: )}
lines[604] = ''; 

fs.writeFileSync('src/pages/Wallet.tsx', lines.join('\\n'));

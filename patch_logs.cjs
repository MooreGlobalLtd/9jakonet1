const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf-8');

file = file.replace(/console\.warn\(`\[KonetBot\] Model/g, 'console.log(`[KonetBot] Model');
file = file.replace(/console\.warn\('\[KonetBot\] Handling/g, 'console.log(\'[KonetBot] Handling');

fs.writeFileSync('server.ts', file);

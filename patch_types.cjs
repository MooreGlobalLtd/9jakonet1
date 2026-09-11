const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace("portfolioImages?: string[]; // Array of image URLs for past work\n}", "portfolioImages?: string[]; // Array of image URLs for past work\n  whatsappNumber?: string;\n}");
fs.writeFileSync('src/types/index.ts', code);
console.log("Types patched");

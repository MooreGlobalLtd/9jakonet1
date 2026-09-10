const fs = require('fs');
let file = fs.readFileSync('src/types/index.ts', 'utf-8');

file = file.replace(
  'priceRange: string;',
  'priceRange: string;\n  portfolioImages?: string[]; // Array of image URLs for past work'
);

fs.writeFileSync('src/types/index.ts', file);
console.log("Patched types");

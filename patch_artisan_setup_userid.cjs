const fs = require('fs');
let file = fs.readFileSync('src/pages/ArtisanSetup.tsx', 'utf-8');

file = file.replace("tradeCategory: trade,", "userId: user.id,\n            tradeCategory: trade,");
fs.writeFileSync('src/pages/ArtisanSetup.tsx', file);

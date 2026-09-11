const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');
code = code.replace("import.meta.env.VITE_GOOGLE_MAPS_API_KEY", "(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY");
fs.writeFileSync('src/pages/Explore.tsx', code);
console.log('Fixed Explore');

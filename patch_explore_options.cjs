const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

code = code.replace(
    /{ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }/,
    '{ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }'
);
fs.writeFileSync('src/pages/Explore.tsx', code);
console.log("Options patched");

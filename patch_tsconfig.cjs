const fs = require('fs');
let tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
if (!tsconfig.compilerOptions.types) {
  tsconfig.compilerOptions.types = [];
}
tsconfig.compilerOptions.types.push("vite-plugin-pwa/client");
fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));

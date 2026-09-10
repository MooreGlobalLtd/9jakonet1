const fs = require('fs');
let viteStr = fs.readFileSync('vite.config.ts', 'utf8');

viteStr = viteStr.replace(
  "workbox: {",
  "workbox: {\n          maximumFileSizeToCacheInBytes: 3000000,"
);
fs.writeFileSync('vite.config.ts', viteStr);

const fs = require('fs');
let code = fs.readFileSync('src/lib/quotaManager.ts', 'utf-8');

code = code.replace(/export function isQuotaExhausted\(\): boolean \{[\s\S]*?\}/, 'export function isQuotaExhausted(): boolean {\n  return false; // Disabled since we are now connected to real Firebase\n}');

fs.writeFileSync('src/lib/quotaManager.ts', code);
console.log("Updated quotaManager.ts!");

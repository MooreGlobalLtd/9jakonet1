const fs = require('fs');
let code = fs.readFileSync('src/lib/quotaManager.ts', 'utf-8');

// Replace everything from export function isQuotaExhausted to the end of that block
code = code.replace(/export function isQuotaExhausted\(\): boolean \{[\s\S]*?\}\s*\}\s*\}/, 'export function isQuotaExhausted(): boolean {\n  return false; // Disabled since we are now connected to real Firebase\n}');

fs.writeFileSync('src/lib/quotaManager.ts', code);
console.log("Updated quotaManager.ts!");

const fs = require('fs');
let file = fs.readFileSync('src/types/index.ts', 'utf-8');

file = file.replace(
  "updatedAt: number;",
  "updatedAt: number;\n  lastSenderId?: string;\n  isRead?: boolean;"
);

fs.writeFileSync('src/types/index.ts', file);

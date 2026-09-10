const fs = require('fs');
let file = fs.readFileSync('src/types/index.ts', 'utf-8');

file = file.replace(/status: 'pending_escrow' \| 'in_progress' \| 'completed' \| 'disputed';\n  createdAt: number;/g, "status: 'pending_escrow' | 'in_progress' | 'completed' | 'disputed';\n  createdAt: number;\n  fundedAt?: number;\n  completedAt?: number;");

fs.writeFileSync('src/types/index.ts', file);

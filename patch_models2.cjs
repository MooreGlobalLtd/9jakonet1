const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf-8');

const targetModels = `const candidateModels = ['gemini-3.8-flash'];`;
const replaceModels = `const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];`;

file = file.replace(targetModels, replaceModels);
fs.writeFileSync('server.ts', file);

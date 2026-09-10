const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf-8');

const targetModels = `const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-pro-preview'];`;
const replaceModels = `const candidateModels = ['gemini-3.8-flash'];`;

file = file.replace(targetModels, replaceModels);
fs.writeFileSync('server.ts', file);

// Also make sure .env.example exists and has the key
if (fs.existsSync('.env.example')) {
  let envFile = fs.readFileSync('.env.example', 'utf-8');
  if (!envFile.includes('GEMINI_API_KEY')) {
    fs.appendFileSync('.env.example', '\nGEMINI_API_KEY=\n');
  }
} else {
  fs.writeFileSync('.env.example', 'GEMINI_API_KEY=\n');
}

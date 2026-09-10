const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf-8');

file = file.replace(/https:\/\/9jakonet\.ng/g, 'https://9jakonet.mooregloballtd.online');
file = file.replace(/9jakonet\.ng/g, '9jakonet.mooregloballtd.online');

fs.writeFileSync('server.ts', file);

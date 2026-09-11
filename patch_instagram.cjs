const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const targetIG = `href="https://instagram.com"`;
const replacementIG = `href="https://www.instagram.com/9jakonet?stkn=dXN6Z29sczZucm03&utm_source=qr"`;

code = code.replace(targetIG, replacementIG);

fs.writeFileSync('src/pages/Home.tsx', code);
console.log("Instagram link updated in Home.tsx");

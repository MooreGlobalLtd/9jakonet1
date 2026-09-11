const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const targetMenu = `          <a href="/9jakonet_logo.svg" download className="text-amber-600 hover:text-amber-700 font-bold ml-4">⬇ Download Logo</a>`;
const replacementMenu = `          <a href="/9jakonet_official_logo.png" download className="text-amber-600 hover:text-amber-700 font-bold ml-4">⬇ Download Logo (PNG)</a>`;

if(code.includes(targetMenu)) {
  code = code.replace(targetMenu, replacementMenu);
  fs.writeFileSync('src/components/layout/Navbar.tsx', code);
  console.log("Navbar patched with PNG link");
} else {
  console.log("Navbar target not found");
}

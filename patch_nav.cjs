const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const targetMenu = `          <Link to="/explore" className="hover:text-emerald-600">Explore</Link>`;
const replacementMenu = `          <Link to="/explore" className="hover:text-emerald-600">Explore</Link>
          <a href="/9jakonet_logo.svg" download className="text-amber-600 hover:text-amber-700 font-bold ml-4">⬇ Download Logo</a>`;

if(code.includes(targetMenu) && !code.includes('Download Logo')) {
  code = code.replace(targetMenu, replacementMenu);
  fs.writeFileSync('src/components/layout/Navbar.tsx', code);
  console.log("Navbar patched with download link");
} else {
  console.log("Navbar already has link or target not found");
}

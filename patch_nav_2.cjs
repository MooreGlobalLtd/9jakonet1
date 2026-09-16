const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const target = `<Link \n            to="/explore" \n            onClick={closeMenu} \n            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"\n          >\n            Explore\n          </Link>`;

const replacement = `<Link \n            to="/explore" \n            onClick={closeMenu} \n            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"\n          >\n            Explore Artisans\n          </Link>\n          <Link \n            to="/marketplace" \n            onClick={closeMenu} \n            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"\n          >\n            Marketplace\n          </Link>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/layout/Navbar.tsx', content);

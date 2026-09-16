const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

content = content.replace(
  '            Explore\\n          </Link>',
  '            Explore Artisans\\n          </Link>\\n          <Link \\n            to="/marketplace" \\n            onClick={closeMenu} \\n            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"\\n          >\\n            Marketplace\\n          </Link>'
);
fs.writeFileSync('src/components/layout/Navbar.tsx', content);

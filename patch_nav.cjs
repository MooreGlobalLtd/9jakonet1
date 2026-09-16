const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

if (!content.includes('to="/marketplace"')) {
  content = content.replace('<Link to="/explore" className="hover:text-emerald-600">Explore</Link>', '<Link to="/explore" className="hover:text-emerald-600">Explore Artisans</Link>\n          <Link to="/marketplace" className="hover:text-emerald-600">Marketplace</Link>');
  
  content = content.replace('to="/explore"\n                className="block text-slate-700 font-medium"', 'to="/explore"\n                className="block text-slate-700 font-medium"\n                onClick={() => setMobileMenuOpen(false)}\n              >\n                Explore Artisans\n              </Link>\n              <Link\n                to="/marketplace"\n                className="block text-slate-700 font-medium"');
  
  fs.writeFileSync('src/components/layout/Navbar.tsx', content);
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const target = `            <div>
              <h3 className="text-white font-semibold mb-4">Links</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How it works</Link></li>
                <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Find Artisans</Link></li>
                <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Join as Artisan</Link></li>
              </ul>
            </div>`;

// Wait, let's see what's actually there.

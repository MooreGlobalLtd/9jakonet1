const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const target = `            <div>
              <h3 className="text-white text-xl font-bold mb-4">9jaKonet</h3>`;

const replacement = `            <div>
              <h3 className="text-white text-xl font-bold mb-4">9jaKonet</h3>
              <div className="mb-6">
                <Link to="/promo" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Watch Promo Video
                </Link>
              </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Home.tsx', code);
console.log("Home footer fixed");

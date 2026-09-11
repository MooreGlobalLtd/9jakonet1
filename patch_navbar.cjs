const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const targetLogo = `<Link to="/" className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-xl text-white">
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              9jaKonet<br className="sm:hidden" /> <span className="text-emerald-600">NG</span>
            </span>
          </Link>`;

const replacementLogo = `<Link to="/" className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            {/* The Verified 9 Shield Logo */}
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <path d="M60 15 L20 30 L20 60 C20 85 50 100 60 105 C70 100 100 85 100 60 L100 30 Z" fill="none" stroke="#10b981" strokeWidth="12" strokeLinejoin="round" />
                <g transform="translate(30, 26) scale(0.5)">
                  <path d="M65 30 A 20 20 0 1 1 45 50 A 20 20 0 0 1 65 30 Z" fill="none" stroke="#f59e0b" strokeWidth="18" />
                  <path d="M85 50 L85 85 A 20 20 0 0 1 45 85" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="85" cy="30" r="16" fill="#10b981" />
                </g>
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              9jaKonet<br className="sm:hidden" /> <span className="text-emerald-600">NG</span>
            </span>
          </Link>`;

if(code.includes('<Wrench')) {
    // try to replace the exact block first
    if(code.includes(targetLogo)) {
        code = code.replace(targetLogo, replacementLogo);
    } else {
        // regex replace if formatting is slightly off
        const regex = /<Link to="\/" className="flex[^>]+>[\s\S]*?<Wrench[^>]+>[\s\S]*?<\/div>[\s\S]*?<span[^>]+>[\s\S]*?9jaKonet[\s\S]*?<\/span>[\s\S]*?<\/Link>/m;
        code = code.replace(regex, replacementLogo);
    }
    fs.writeFileSync('src/components/layout/Navbar.tsx', code);
    console.log("Navbar updated");
} else {
    console.log("Could not find logo in Navbar");
}

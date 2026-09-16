const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const targetDesktop = `<Link to="/wallet" className="flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                ₦{(user.walletBalance || 0).toLocaleString()}
              </Link>`;

const replaceDesktop = `<Link to="/wallet" className="flex items-center rounded-full bg-slate-100 px-4 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 transition-colors gap-2 border border-slate-200 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.59l-9.74-4.87a2 2 0 0 1-1.11-1.79V8a2 2 0 0 1 2-2h15Z"/><path d="M22 12v3h-3a2 2 0 0 1 0-4Z"/></svg>
                <span>Wallet & Bank</span>
                <span className="bg-white px-2 py-0.5 rounded-full text-emerald-700 text-xs shadow-sm">₦{(user.walletBalance || 0).toLocaleString()}</span>
              </Link>`;

content = content.replace(targetDesktop, replaceDesktop);

fs.writeFileSync('src/components/layout/Navbar.tsx', content);

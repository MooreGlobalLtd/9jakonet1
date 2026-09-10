const fs = require('fs');
let file = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');

const mobileMenuTarget = `<Link to="/messages" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                <span>Messages</span>
                {unreadChatsCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>`;

const mobileMenuReplacement = `<Link to="/messages" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                <span>Messages</span>
                {unreadChatsCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                <span>Notifications</span>
                {unreadNotifCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </Link>`;

file = file.replace(mobileMenuTarget, mobileMenuReplacement);
fs.writeFileSync('src/components/layout/Navbar.tsx', file);

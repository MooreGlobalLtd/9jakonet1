const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// Remove from public section
const publicLink = `\n          <a href="/9jakonet_official_logo.png" download className="text-amber-600 hover:text-amber-700 font-bold ml-4">⬇ Download Logo (PNG)</a>`;
code = code.replace(publicLink, '');

// Add to desktop admin section
const desktopAdmin = `              {(user.role === 'admin' || (user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')) && (
                <Link to="/admin" className="font-semibold text-amber-600 hover:text-amber-700">Admin Panel</Link>
              )}`;
const newDesktopAdmin = `              {(user.role === 'admin' || (user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')) && (
                <>
                  <Link to="/admin" className="font-semibold text-amber-600 hover:text-amber-700">Admin Panel</Link>
                  <a href="/9jakonet_official_logo.png" download className="text-amber-600 hover:text-amber-700 font-bold ml-4" title="Download Official Logo">⬇ Logo</a>
                </>
              )}`;

code = code.replace(desktopAdmin, newDesktopAdmin);

// Add to mobile admin section
const mobileAdmin = `              {(user.role === 'admin' || (user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')) && (
                <Link to="/admin" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-semibold text-amber-600 hover:bg-amber-50">
                  Admin Panel
                </Link>
              )}`;
const newMobileAdmin = `              {(user.role === 'admin' || (user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')) && (
                <>
                  <Link to="/admin" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-semibold text-amber-600 hover:bg-amber-50">
                    Admin Panel
                  </Link>
                  <a href="/9jakonet_official_logo.png" download onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-semibold text-amber-600 hover:bg-amber-50">
                    ⬇ Download Logo (PNG)
                  </a>
                </>
              )}`;

code = code.replace(mobileAdmin, newMobileAdmin);

fs.writeFileSync('src/components/layout/Navbar.tsx', code);
console.log("Navbar patched to hide logo download from public");

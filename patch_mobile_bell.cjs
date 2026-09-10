const fs = require('fs');
let file = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');

const target = `{/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="sm" className="px-2" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>`;

const replacement = `{/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-1">
          {user && (
            <Link 
              to="/dashboard" 
              onClick={markNotifsAsRead}
              className="relative p-2 text-slate-600 hover:text-emerald-600 rounded-full flex items-center justify-center"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </Link>
          )}
          <Button variant="ghost" size="sm" className="px-2" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>`;

file = file.replace(target, replacement);
fs.writeFileSync('src/components/layout/Navbar.tsx', file);

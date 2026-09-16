const fs = require('fs');
let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

const target = `<Button onClick={() => user ? setIsPosting(true) : navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 shadow-md">
            <Plus className="w-5 h-5 mr-2" />
            Sell an Item
          </Button>`;

const replacement = `<div className="flex gap-3">
            {user && (
              <Button onClick={() => navigate('/wallet')} variant="outline" className="h-12 px-6 shadow-sm border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-banknote w-5 h-5 mr-2 text-emerald-600"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                Bank Details
              </Button>
            )}
            <Button onClick={() => user ? setIsPosting(true) : navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              Sell an Item
            </Button>
          </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Marketplace.tsx', content);

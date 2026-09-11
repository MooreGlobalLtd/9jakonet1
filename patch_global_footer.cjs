const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf8');

if (!code.includes('import { ShieldAlert, ArrowRight, Instagram }')) {
    code = code.replace("import { ShieldAlert, ArrowRight } from 'lucide-react';", "import { ShieldAlert, ArrowRight, Instagram } from 'lucide-react';");
}

const targetFooter = `<footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} 9jaKonet NG. All rights reserved.
        </div>
      </footer>`;

const replacementFooter = `<footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center justify-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/9jakonet?stkn=dXN6Z29sczZucm03&utm_source=qr" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-500 transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
          <div>&copy; {new Date().getFullYear()} 9jaKonet NG. All rights reserved.</div>
        </div>
      </footer>`;

code = code.replace(targetFooter, replacementFooter);

fs.writeFileSync('src/components/layout/AppLayout.tsx', code);
console.log("Global footer patched");

const fs = require('fs');
let code = fs.readFileSync('src/pages/LogoPreview.tsx', 'utf8');

const targetStr = `          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
            COMBINED DESIGN
          </div>`;

const replacementStr = `          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
            COMBINED DESIGN
          </div>
          <div className="absolute bottom-4 right-4">
            <a href="/9jakonet_logo.svg" download="9jakonet_logo.svg" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-slate-800 transition-colors">
              Download Logo
            </a>
          </div>`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/LogoPreview.tsx', code);
    console.log("Download button added to LogoPreview.tsx");
} else {
    console.log("Could not find target string.");
}

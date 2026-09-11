const fs = require('fs');
let code = fs.readFileSync('src/pages/LogoPreview.tsx', 'utf8');

// The LogoPreview.tsx was using the client-side canvas trick, but since we now have a perfect high-res PNG on the server, we can just replace the button to point to the file.
const targetBtn = `<button onClick={downloadAsPng} className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 transition-colors">
              <Download className="h-4 w-4" /> Download High-Res PNG
            </button>`;
            
const replacementBtn = `<a href="/9jakonet_official_logo.png" download="9jakonet_official_logo.png" className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 transition-colors">
              <Download className="h-4 w-4" /> Download High-Res PNG
            </a>`;

if(code.includes(targetBtn)) {
  code = code.replace(targetBtn, replacementBtn);
  fs.writeFileSync('src/pages/LogoPreview.tsx', code);
  console.log("LogoPreview patched with direct PNG link");
} else {
  console.log("LogoPreview target not found");
}

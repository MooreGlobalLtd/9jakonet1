const fs = require('fs');
let code = fs.readFileSync('src/pages/LogoPreview.tsx', 'utf8');

// Ensure Download is imported from lucide-react
if (!code.includes('Download }')) {
  code = code.replace("import { ArrowLeft } from 'lucide-react';", "import { ArrowLeft, Download } from 'lucide-react';");
}

const downloadFunc = `  const downloadAsPng = () => {
    const svgElement = document.getElementById('logo-svg');
    if (!svgElement) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const data = (new XMLSerializer()).serializeToString(svgElement);
    const DOMURL = window.URL || window.webkitURL || window;
    
    const img = new Image();
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = function () {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      DOMURL.revokeObjectURL(url);
      
      const imgURI = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
          
      const evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
      });
      
      const a = document.createElement('a');
      a.setAttribute('download', '9jakonet_official_logo.png');
      a.setAttribute('href', imgURI);
      a.setAttribute('target', '_blank');
      a.dispatchEvent(evt);
    };
    img.src = url;
  };
`;

const targetFuncInsert = `export default function LogoPreview() {
`;

code = code.replace(targetFuncInsert, targetFuncInsert + downloadFunc);

const targetId = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">`;
code = code.replace(targetId, `<svg id="logo-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">`);

const targetBtn = `<div className="absolute bottom-4 right-4">
            <a href="/9jakonet_logo.svg" download="9jakonet_logo.svg" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-slate-800 transition-colors">
              Download Logo
            </a>
          </div>`;
          
const replacementBtn = `<div className="absolute bottom-4 right-4 flex gap-2">
            <button onClick={downloadAsPng} className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 transition-colors">
              <Download className="h-4 w-4" /> Download High-Res PNG
            </button>
          </div>`;

if(code.includes(targetBtn)) {
  code = code.replace(targetBtn, replacementBtn);
  fs.writeFileSync('src/pages/LogoPreview.tsx', code);
  console.log("PNG download button added.");
} else {
  console.log("Could not find button to replace.");
}

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if(!code.includes('import PromoTrailer')) {
  code = code.replace("import EscrowPolicy from './pages/EscrowPolicy';", "import EscrowPolicy from './pages/EscrowPolicy';\nimport PromoTrailer from './pages/PromoTrailer';");
}

if(!code.includes('<Route path="promo" element={<PromoTrailer />} />')) {
  code = code.replace('<Route path="logo-preview" element={<LogoPreview />} />', '<Route path="logo-preview" element={<LogoPreview />} />\n          <Route path="promo" element={<PromoTrailer />} />');
}

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx fixed");

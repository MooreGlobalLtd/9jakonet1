const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('LogoPreview')) {
  code = code.replace(
    "import AppLayout from './components/layout/AppLayout';",
    "import AppLayout from './components/layout/AppLayout';\nimport LogoPreview from './pages/LogoPreview';"
  );
  
  code = code.replace(
    '<Route path="terms" element={<Terms />} />',
    '<Route path="terms" element={<Terms />} />\n          <Route path="logo-preview" element={<LogoPreview />} />'
  );
  
  fs.writeFileSync('src/App.tsx', code);
}

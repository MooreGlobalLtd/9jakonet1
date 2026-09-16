const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import Marketplace from')) {
  content = content.replace("import Explore from './pages/Explore';", "import Explore from './pages/Explore';\nimport Marketplace from './pages/Marketplace';");
  
  content = content.replace('<Route path="explore" element={<Explore />} />', '<Route path="explore" element={<Explore />} />\n          <Route path="marketplace" element={<Marketplace />} />');
  
  fs.writeFileSync('src/App.tsx', content);
}

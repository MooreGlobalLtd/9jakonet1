const fs = require('fs');
let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

content = content.replace(
  "if (!confirm('Are you sure you want to delete this ad?')) return;",
  "// confirm removed because of iframe restrictions"
);

fs.writeFileSync('src/pages/Marketplace.tsx', content);

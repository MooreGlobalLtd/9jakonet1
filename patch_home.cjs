const fs = require('fs');
let file = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Chioma fix
file = file.replace(
  '"https://images.unsplash.com/photo-1531123414708-f11634563acc?w=150&auto=format&fit=crop&q=80"',
  '"https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&auto=format&fit=crop&q=80"'
);

fs.writeFileSync('src/pages/Home.tsx', file);

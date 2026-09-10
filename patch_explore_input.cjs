const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

file = file.replace(/placeholder="Filter by location \(e\.g\. Lagos\)\.\.\."/, 'placeholder="Filter by state or city (e.g. Lagos, Ikeja)..."');

fs.writeFileSync('src/pages/Explore.tsx', file);

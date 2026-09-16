const fs = require('fs');
let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

content = content.replace(
  "const filesToUpload = Array.from(files).slice(0, availableSlots);",
  "const filesToUpload = (Array.from(files) as File[]).slice(0, availableSlots);"
);

fs.writeFileSync('src/pages/Profile.tsx', content);

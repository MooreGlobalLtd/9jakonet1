const fs = require('fs');
let content = fs.readFileSync('src/components/security/LiveLocationWatcher.tsx', 'utf8');

content = content.replace(
  "Use {user?.state || 'Lagos'} Pin",
  "Use Profile Location"
);
content = content.replace(
  "Use {user?.state || 'Lagos'} Pin",
  "Use Profile Location"
);

fs.writeFileSync('src/components/security/LiveLocationWatcher.tsx', content);

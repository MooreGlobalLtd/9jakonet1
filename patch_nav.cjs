const fs = require('fs');
let nav = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// add import
if (!nav.includes('PWAInstallButton')) {
  nav = nav.replace(
    "import { Button } from '../ui/button';",
    "import { Button } from '../ui/button';\nimport { PWAInstallButton } from '../PWAInstallButton';"
  );

  // insert button
  nav = nav.replace(
    '<div className="relative group">',
    '<PWAInstallButton variant="nav" />\n              <div className="relative group">'
  );
  fs.writeFileSync('src/components/layout/Navbar.tsx', nav);
}

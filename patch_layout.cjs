const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// Insert PWA nav button inside Navbar right before or after UserProfileMenu
layout = layout.replace(
  "import UserProfileMenu from '../profile/UserProfileMenu';",
  "import UserProfileMenu from '../profile/UserProfileMenu';\nimport { PWAInstallButton } from '../PWAInstallButton';"
);

// find where to put it in the UI, before notifications
layout = layout.replace(
  '<NotificationsDropdown />',
  '<PWAInstallButton variant="nav" />\n              <NotificationsDropdown />'
);

fs.writeFileSync('src/components/layout/Navbar.tsx', layout);

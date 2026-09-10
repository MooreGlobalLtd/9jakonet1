const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// replace the top imports block
app = app.replace(
  "import VerificationKYC from './pages/VerificationKYC';",
  "import VerificationKYC from './pages/VerificationKYC';\nimport { PWAInstallButton } from './components/PWAInstallButton';"
);

// find <Toaster position="top-center" richColors /> and insert the banner below it
app = app.replace(
  '<Toaster position="top-center" richColors />',
  '<Toaster position="top-center" richColors />\n      <PWAInstallButton variant="banner" />'
);

fs.writeFileSync('src/App.tsx', app);

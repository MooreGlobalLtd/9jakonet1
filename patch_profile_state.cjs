const fs = require('fs');
let file = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');

file = file.replace(
  'const [avatarUploading, setAvatarUploading] = useState(false);',
  'const [avatarUploading, setAvatarUploading] = useState(false);\n  const [portfolioUploading, setPortfolioUploading] = useState(false);\n  const [portfolioImages, setPortfolioImages] = useState<string[]>(artisanProfile?.portfolioImages || []);'
);

file = file.replace(
  'if (user.avatar) setAvatarUrl(user.avatar);',
  'if (user.avatar) setAvatarUrl(user.avatar);\n      if (artisanProfile?.portfolioImages) setPortfolioImages(artisanProfile.portfolioImages);'
);

// We need an update section for Artisan data too.
// Let's see if Profile.tsx updates artisanProfile.
fs.writeFileSync('src/pages/Profile.tsx', file);

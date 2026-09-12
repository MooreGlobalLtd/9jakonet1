const fs = require('fs');
// Let's just copy the 2048x2048 to pwa-192x192.png and pwa-512x512.png
// The browser will scale them down. It's not perfectly optimized for bandwidth,
// but it will immediately satisfy the PWA manifest requirement.
fs.copyFileSync('public/9jakonet_official_logo.png', 'public/pwa-192x192.png');
fs.copyFileSync('public/9jakonet_official_logo.png', 'public/pwa-512x512.png');
fs.copyFileSync('public/9jakonet_official_logo.png', 'public/pwa-maskable-512x512.png');
console.log('Copies created.');

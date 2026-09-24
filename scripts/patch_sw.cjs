const fs = require('fs');
const path = require('path');

const distSwPath = path.join(process.cwd(), 'dist', 'sw.js');
const publicSwPath = path.join(process.cwd(), 'public', 'sw.js');

if (fs.existsSync(distSwPath) && fs.existsSync(publicSwPath)) {
  const distContent = fs.readFileSync(distSwPath, 'utf-8');
  const publicContent = fs.readFileSync(publicSwPath, 'utf-8');

  if (!distContent.includes("addEventListener('push'")) {
    console.log('[PWA Build] Injecting Web Push handlers into dist/sw.js...');
    const combined = `${distContent}\n\n/* Injected 9jaKonet Web Push & Lock Screen Notification Handlers */\n${publicContent}`;
    fs.writeFileSync(distSwPath, combined, 'utf-8');
    console.log('[PWA Build] Successfully patched dist/sw.js with background push support!');
  } else {
    console.log('[PWA Build] dist/sw.js already contains push handlers.');
  }
} else {
  console.log('[PWA Build] Note: dist/sw.js or public/sw.js not found yet.');
}

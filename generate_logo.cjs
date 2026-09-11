const fs = require('fs');

const svgContent = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad4a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#059669" />
      <stop offset="100%" stopColor="#064e3b" />
    </linearGradient>
  </defs>
  <!-- Background to make it visible as DP -->
  <rect width="120" height="120" fill="#ffffff" />
  <!-- Shield -->
  <path d="M60 15 L20 30 L20 60 C20 85 50 100 60 105 C70 100 100 85 100 60 L100 30 Z" fill="none" stroke="url(#grad4a)" strokeWidth="12" strokeLinejoin="round" />
  <!-- Inner 9 in Amber -->
  <g transform="translate(30, 26) scale(0.5)">
    <path d="M65 30 A 20 20 0 1 1 45 50 A 20 20 0 0 1 65 30 Z" fill="none" stroke="#f59e0b" strokeWidth="18" />
    <path d="M85 50 L85 85 A 20 20 0 0 1 45 85" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" />
    <circle cx="85" cy="30" r="16" fill="#10b981" />
  </g>
</svg>`;

fs.writeFileSync('public/9jakonet_logo.svg', svgContent);
console.log("SVG saved to public/9jakonet_logo.svg");

const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

content = content.replace(
  'Release Funds to Artisan',
  '{job.contractType === "product" ? "Confirm Delivery & Release Funds" : "Release Funds to Artisan"}'
);

content = content.replace(
  '<p style="color: #475569; font-size: 15px;">\\n                You are authorizing the release of escrow funds for the job: <strong>"${job.title}"</strong> to artisan <strong>${job.artisanName}</strong>.\\n              </p>',
  '<p style="color: #475569; font-size: 15px;">\\n                You are authorizing the release of escrow funds for the ${job.contractType === "product" ? "order" : "job"}: <strong>"${job.title}"</strong> to ${job.contractType === "product" ? "seller" : "artisan"} <strong>${job.artisanName}</strong>.\\n              </p>'
);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

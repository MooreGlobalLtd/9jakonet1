const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

content = content.replace(
  /\{\(user\.role === 'customer' \|\| user\.role === 'admin'\) && job\.status === 'in_progress' && \(/g,
  "{(user.id === job.customerId || user.role === 'admin') && job.status === 'in_progress' && ("
);

content = content.replace(
  /\{user\.role === 'artisan' && job\.status === 'in_progress' && \(/g,
  "{user.id === job.artisanId && job.status === 'in_progress' && ("
);

// Fix the display of net payout
content = content.replace(
  /Your net payout will be ₦\{\(\(job\.amount \|\| 0\) \* 0\.9\)\.toLocaleString\(\)\} upon completion/g,
  "Your net payout will be ₦{(job.amount || 0).toLocaleString()} (0% Promo) upon completion"
);

// Fix the display of review section role check
content = content.replace(
  /\{job\.status === 'completed' && \(user\.role === 'customer' \|\| user\.role === 'admin'\) && !job\.reviewScore && \(/g,
  "{job.status === 'completed' && (user.id === job.customerId || user.role === 'admin') && !job.reviewScore && ("
);

// Also fix the fund escrow button role check
content = content.replace(
  /\{\(user\.role === 'customer' \|\| user\.role === 'admin'\) && job\.status === 'pending_escrow' && \(/g,
  "{(user.id === job.customerId || user.role === 'admin') && job.status === 'pending_escrow' && ("
);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

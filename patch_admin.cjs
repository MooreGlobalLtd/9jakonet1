const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace('Platform Revenue (10% of completed jobs)', 'Total Escrow Volume (0% Promo)');
content = content.replace('<span className="text-slate-400">10% Platform Cut</span>', '<span className="text-slate-400">0% Commission (Promo)</span>');
content = content.replace('Complete audit log of 10% platform commission with exact dates, times, and artisan details.', 'Complete audit log of all completed escrow jobs and platform revenue.');
content = content.replace('10% retained from all finished jobs', '0% currently retained (100% payout promo)');
content = content.replace('Whenever a customer clicks &ldquo;Release Funds&rdquo; for an artisan, the job and 10% commission entry will be instantly logged here with exact date and time.', 'Whenever a customer clicks &ldquo;Release Funds&rdquo;, the completed job will be logged here.');
content = content.replace('<th className="px-4 py-3 text-emerald-700 bg-emerald-50/50">Commission (10%)</th>', '<th className="px-4 py-3 text-emerald-700 bg-emerald-50/50">Commission (0%)</th>');

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);

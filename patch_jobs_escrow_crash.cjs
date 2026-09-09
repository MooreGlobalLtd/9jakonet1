const fs = require('fs');

let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

// Replace job.amount.toLocaleString() with (job.amount || 0).toLocaleString()
file = file.replace(/job\.amount\.toLocaleString\(\)/g, "(job.amount || 0).toLocaleString()");

// Replace Math.round(job.amount * 0.9).toLocaleString() with Math.round((job.amount || 0) * 0.9).toLocaleString()
file = file.replace(/Math\.round\(job\.amount \* 0\.9\)\.toLocaleString\(\)/g, "Math.round((job.amount || 0) * 0.9).toLocaleString()");
file = file.replace(/Math\.round\(job\.amount \* 0\.90\)\.toLocaleString\(\)/g, "Math.round((job.amount || 0) * 0.90).toLocaleString()");

// Replace Math.round(job.amount * 0.10).toLocaleString()
file = file.replace(/Math\.round\(otpModalJob\.amount \* 0\.10\)\.toLocaleString\(\)/g, "Math.round((otpModalJob.amount || 0) * 0.10).toLocaleString()");
file = file.replace(/Math\.round\(otpModalJob\.amount \* 0\.90\)\.toLocaleString\(\)/g, "Math.round((otpModalJob.amount || 0) * 0.90).toLocaleString()");
file = file.replace(/otpModalJob\.amount\.toLocaleString\(\)/g, "(otpModalJob.amount || 0).toLocaleString()");
file = file.replace(/job\.amount \* 100/g, "(job.amount || 0) * 100");

// Also add a block to display "open" jobs properly without Escrow actions
const openJobStatus = `
                    {job.status === 'open' && (
                      <div className="flex flex-col md:items-end gap-3 min-w-[180px]">
                        <div className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                          Waiting for Artisan
                        </div>
                      </div>
                    )}
                    
                    {user.role === 'customer' || user.role === 'admin'
`;

// Wait, the status check is:
// {(user.role === 'customer' || user.role === 'admin') && job.status === 'pending_escrow' && (

// Let's replace:
file = file.replace(/\{\(user\.role === 'customer' \|\| user\.role === 'admin'\) && job\.status === 'pending_escrow' && \(/g, 
`{job.status === 'open' && (
                      <div className="flex flex-col md:items-end gap-2 min-w-[180px]">
                        <div className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 self-end">
                          Looking for Artisan
                        </div>
                        <a href="/explore" className="text-xs text-emerald-600 hover:underline font-semibold text-right">
                          Browse Artisans &rarr;
                        </a>
                      </div>
                    )}
                    
                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'pending_escrow' && (`);


fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);
console.log("Patched JobsAndEscrow.tsx for amount rendering crash");

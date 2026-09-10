const fs = require('fs');
let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

const targetStr = `<div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDateTime(job.createdAt)}</span>
                </div>`;

const replacementStr = `<div className="flex flex-col items-end gap-1 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5"><span className="text-slate-400">Created:</span> {formatDateTime(job.createdAt)}</div>
                  {job.fundedAt && <div className="flex items-center gap-1.5 text-blue-600"><span className="text-blue-400">Funded:</span> {formatDateTime(job.fundedAt)}</div>}
                  {job.completedAt && <div className="flex items-center gap-1.5 text-emerald-600"><span className="text-emerald-400">Completed:</span> {formatDateTime(job.completedAt)}</div>}
                </div>`;

file = file.replace(targetStr, replacementStr);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);

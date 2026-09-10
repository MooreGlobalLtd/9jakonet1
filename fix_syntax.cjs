const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const regex = /<\/div>\s*<\/div>\s*<div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm grid grid-cols-2 gap-2">.*?<\/div>\s*<\/div>\s*\)\s*\}\)/s;

const replacement = `                    </div>
                  )
                })`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Fixed syntax error");

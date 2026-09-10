const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const regex = /                        <\/div>\s*<\/div>\s*\)\s*\}\)/s;
const replacement = `                        </div>
                      </div>
                    </div>
                  )
                })`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Fixed syntax error 2");

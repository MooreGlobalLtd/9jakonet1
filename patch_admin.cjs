const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

code = code.replace(
  "if (user?.role !== 'admin') {",
  "const isSuperAdmin = user?.email === 'ayorindesamuel705@gmail.com';\n  if (user?.role !== 'admin' && !isSuperAdmin) {"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Patched!");

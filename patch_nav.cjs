const fs = require('fs');

// Patch Navbar.tsx
let nav = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');
nav = nav.replace(/user\.role === 'admin'/g, "(user.role === 'admin' || user.email === 'ayorindesamuel705@gmail.com')");
fs.writeFileSync('src/components/layout/Navbar.tsx', nav);

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/if \(user\.role !== 'admin'\)/g, "if (user.role !== 'admin' && user.email !== 'ayorindesamuel705@gmail.com')");
fs.writeFileSync('src/App.tsx', app);

console.log("Patched Navbar and App.tsx!");

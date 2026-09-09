const fs = require('fs');

const oldEmail = "'ayorindesamuel705@gmail.com'";
const newCondition = "(user?.email === 'ayorindesamuel705@gmail.com' || user?.email === 'info@mooregloballtd.online')";

// Patch AdminDashboard.tsx
let admin = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');
admin = admin.replace(/user\?\.email === 'ayorindesamuel705@gmail\.com'/g, newCondition);
fs.writeFileSync('src/pages/AdminDashboard.tsx', admin);

// Patch Navbar.tsx
let nav = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');
nav = nav.replace(/user\.email === 'ayorindesamuel705@gmail\.com'/g, "(user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')");
fs.writeFileSync('src/components/layout/Navbar.tsx', nav);

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/user\.email !== 'ayorindesamuel705@gmail\.com'/g, "(user.email !== 'ayorindesamuel705@gmail.com' && user.email !== 'info@mooregloballtd.online')");
fs.writeFileSync('src/App.tsx', app);

console.log("Patched all files to include info@mooregloballtd.online!");

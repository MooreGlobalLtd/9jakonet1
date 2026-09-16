const fs = require('fs');
let register = fs.readFileSync('src/pages/Register.tsx', 'utf8');

register = register.replace(
  "await signInWithPopup(auth, googleProvider);",
  "sessionStorage.setItem('pendingRegistrationRole', role);\n      await signInWithPopup(auth, googleProvider);"
);
fs.writeFileSync('src/pages/Register.tsx', register);

let authStore = fs.readFileSync('src/store/authStore.ts', 'utf8');
authStore = authStore.replace(
  "if (isNewUser) {",
  `if (isNewUser) {
              const pendingRole = (sessionStorage.getItem('pendingRegistrationRole') as any) || 'customer';
              sessionStorage.removeItem('pendingRegistrationRole');`
);
authStore = authStore.replace(
  "role: 'customer' as const,",
  "role: pendingRole,"
);
fs.writeFileSync('src/store/authStore.ts', authStore);

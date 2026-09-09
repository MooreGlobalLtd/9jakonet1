const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

const oldFuncRegex = /await setDoc\(doc\(db, 'users', userId\), payload, \{ merge: true \}\);/m;
const newFuncCode = `
      // Wrap setDoc in a 5-second timeout to catch hung connections
      const writePromise = setDoc(doc(db, 'users', userId), payload, { merge: true });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("FIREBASE_TIMEOUT")), 5000));
      
      await Promise.race([writePromise, timeoutPromise]);
`;

if (oldFuncRegex.test(code)) {
  code = code.replace(oldFuncRegex, newFuncCode);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
  console.log("Replaced");
} else {
  console.log("Not found");
}

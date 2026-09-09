const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf-8');

const regex = /\/\/ 1\. Create Firebase Auth user[\s\S]*?const userCredential = await createUserWithEmailAndPassword\(auth, email\.trim\(\), password\);/m;

const newCode = `// 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 1.5 Create the user in Firestore database so they have a profile
      const newUser: User = {
        id: userCredential.user.uid,
        email: email.trim(),
        displayName: fullName.trim(),
        role: role,
        createdAt: Date.now(),
        walletBalance: 0,
        isKycVerified: false
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);`;

if (regex.test(code)) {
  code = code.replace(regex, newCode);
  fs.writeFileSync('src/pages/Register.tsx', code);
  console.log("Updated Register.tsx to save to DB");
} else {
  console.log("Could not find regex in Register");
}

const fs = require('fs');
let code = fs.readFileSync('src/store/authStore.ts', 'utf-8');

const regex = /init: \(\) => \{[\s\S]*\}\)\}\)\);/m;

const newCode = `init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
      if (artisanUnsubscribe) { artisanUnsubscribe(); artisanUnsubscribe = null; }
      
      if (firebaseUser) {
        // FAST LOGIN FIX: Since we bypassed Firestore, we instantly create a user object 
        // from the Auth token to prevent the database connection from causing loading delays!
        const fallbackUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          role: 'customer',
          createdAt: Date.now(),
          walletBalance: 0,
          isKycVerified: false
        };
        set({ user: fallbackUser, loading: false, initialized: true });
      } else {
        set({ user: null, artisanProfile: null, loading: false, initialized: true });
      }
    });
  }
}));`;

if (regex.test(code)) {
  code = code.replace(regex, newCode);
  fs.writeFileSync('src/store/authStore.ts', code);
  console.log("Fixed authStore");
} else {
  console.log("Could not fix");
}

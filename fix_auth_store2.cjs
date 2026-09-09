const fs = require('fs');
let code = fs.readFileSync('src/store/authStore.ts', 'utf-8');

const newInit = `  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
      if (artisanUnsubscribe) { artisanUnsubscribe(); artisanUnsubscribe = null; }
      
      if (firebaseUser) {
        // FAST LOGIN FIX: Since we are not using Firestore for profiles right now, 
        // we instantly create a user object from the Auth token to prevent loading delays.
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
  }`;

// Replace the init function
const regex = /init:\s*\(\)\s*=>\s*\{[\s\S]*\}\)\}\)\);/m;
if (regex.test(code)) {
  code = code.replace(regex, newInit + '\n}));');
  fs.writeFileSync('src/store/authStore.ts', code);
  console.log("Updated authStore to skip Firestore and speed up login");
} else {
  console.log("Could not find init function");
}

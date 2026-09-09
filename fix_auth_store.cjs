const fs = require('fs');
let code = fs.readFileSync('src/store/authStore.ts', 'utf-8');

const oldRegex = /if \(userDoc\.exists\(\)\) \{[\s\S]*?\} else \{\n\s*set\(\{ user: null, loading: false, initialized: true \}\);\n\s*\}/m;
const newCode = `if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            set({ user: userData });
            set({ loading: false, initialized: true });
            
            if (userData.role === 'artisan' && !artisanUnsubscribe) {
              artisanUnsubscribe = onSnapshot(doc(db, 'artisans', firebaseUser.uid), (artisanDoc) => {
                if (artisanDoc.exists()) {
                  set({ artisanProfile: artisanDoc.data() as ArtisanProfile });
                }
              }, (err) => console.warn("Artisan profile listener error", err));
            }
          } else {
            // For now: Authenticate users only, do NOT save user profile data
            // Fallback to minimal user object to allow dashboard access
            const fallbackUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'customer',
              createdAt: Date.now(),
              walletBalance: 0
            };
            set({ user: fallbackUser, loading: false, initialized: true });
          }`;

if (oldRegex.test(code)) {
  code = code.replace(oldRegex, newCode);
  fs.writeFileSync('src/store/authStore.ts', code);
  console.log("Updated auth store");
} else {
  console.log("Regex not found in authStore");
}

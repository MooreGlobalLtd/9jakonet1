const fs = require('fs');
let file = fs.readFileSync('src/store/authStore.ts', 'utf-8');

const replaceTarget = `// Auto-create profile for new Google Sign-In users or missing profiles
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'customer' as const,
              createdAt: Date.now(),
              walletBalance: 0,
              isKycVerified: false
            };
            
            try {
              // Create the document. The snapshot listener will immediately fire again
              // with the newly created data.
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            } catch (err) {
              console.error("Error creating missing user profile:", err);
              // Fallback if write fails
              set({ user: newUser, loading: false, initialized: true });
            }`;

const replacement = `// Check if this is a newly created auth user, or if their profile was deleted by admin
            const creationTime = firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now();
            const isNewUser = Date.now() - creationTime < 5 * 60 * 1000; // within 5 minutes of sign up
            
            if (isNewUser) {
              const newUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'User',
                role: 'customer' as const,
                createdAt: Date.now(),
                walletBalance: 0,
                isKycVerified: false
              };
              
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              } catch (err) {
                console.error("Error creating missing user profile:", err);
                set({ user: newUser, loading: false, initialized: true });
              }
            } else {
              // Profile was deleted. Sign them out.
              console.warn("User profile not found. It may have been deleted by an admin.");
              if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
              if (artisanUnsubscribe) { artisanUnsubscribe(); artisanUnsubscribe = null; }
              await firebaseSignOut(auth);
              set({ user: null, artisanProfile: null, loading: false, initialized: true });
            }`;

file = file.replace(replaceTarget, replacement);
fs.writeFileSync('src/store/authStore.ts', file);
console.log("Patched authStore.ts");

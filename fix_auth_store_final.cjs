const fs = require('fs');

const code = `import { create } from 'zustand';
import { User, ArtisanProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  artisanProfile: ArtisanProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setArtisanProfile: (profile: ArtisanProfile | null) => void;
  init: () => void;
  signOut: () => Promise<void>;
}

let userUnsubscribe: (() => void) | null = null;
let artisanUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  artisanProfile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setArtisanProfile: (profile) => set({ artisanProfile: profile }),
  signOut: async () => {
    if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
    if (artisanUnsubscribe) { artisanUnsubscribe(); artisanUnsubscribe = null; }
    await firebaseSignOut(auth);
    set({ user: null, artisanProfile: null });
  },
  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
      if (artisanUnsubscribe) { artisanUnsubscribe(); artisanUnsubscribe = null; }

      if (firebaseUser) {
        // Now that Firestore is connected and rules are relaxed, we restore the database listener.
        userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            set({ user: userData, loading: false, initialized: true });
            
            // Listen to artisan profile if they are an artisan
            if (userData.role === 'artisan' && !artisanUnsubscribe) {
              artisanUnsubscribe = onSnapshot(doc(db, 'artisans', firebaseUser.uid), (artisanDoc) => {
                if (artisanDoc.exists()) {
                  set({ artisanProfile: artisanDoc.data() as ArtisanProfile });
                }
              }, (err) => console.warn("Artisan profile listener error", err));
            }
          } else {
            // Auto-create profile for new Google Sign-In users or missing profiles
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
            }
          }
        }, (error) => {
          console.error("Error fetching user data:", error);
          // Fallback on error to ensure app doesn't break
          const fallbackUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'customer' as const,
            createdAt: Date.now(),
            walletBalance: 0,
            isKycVerified: false
          };
          set({ user: fallbackUser, loading: false, initialized: true });
        });
      } else {
        set({ user: null, artisanProfile: null, loading: false, initialized: true });
      }
    });
  }
}));
`;

fs.writeFileSync('src/store/authStore.ts', code);
console.log("Updated authStore to use Firestore!");

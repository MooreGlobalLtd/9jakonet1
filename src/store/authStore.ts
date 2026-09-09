import { create } from 'zustand';
import { User, ArtisanProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  artisanProfile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setArtisanProfile: (profile) => set({ artisanProfile: profile }),
  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, artisanProfile: null });
  },
  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            set({ user: userData });

            if (userData.role === 'artisan') {
              const artisanDoc = await getDoc(doc(db, 'artisans', firebaseUser.uid));
              if (artisanDoc.exists()) {
                set({ artisanProfile: artisanDoc.data() as ArtisanProfile });
              }
            }
          } else {
            // User logged in but no profile (might be midway through signup)
            set({ user: null }); 
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Keep user authenticated using basic Auth profile if Firestore is in quota backoff
          const fallbackUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'customer',
            createdAt: Date.now(),
            walletBalance: 0
          };
          set({ user: fallbackUser });
        }
      } else {
        set({ user: null, artisanProfile: null });
      }
      set({ loading: false, initialized: true });
    });
  }
}));

import { create } from 'zustand';
import { User, ArtisanProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

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
        userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
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
            set({ user: null, loading: false, initialized: true });
          }
        }, (error) => {
          console.error("Error fetching user data:", error);
          const fallbackUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'customer',
            createdAt: Date.now(),
            walletBalance: 0
          };
          set({ user: fallbackUser, loading: false, initialized: true });
        });
      } else {
        set({ user: null, artisanProfile: null, loading: false, initialized: true });
      }
    });
  }
}));

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkxGlvAG362J0yUBJLKpZp3BGy57vBY38",
  authDomain: "jakonet-c751d.firebaseapp.com",
  projectId: "jakonet-c751d",
  storageBucket: "jakonet-c751d.firebasestorage.app",
  messagingSenderId: "914813535202",
  appId: "1:914813535202:web:25371248645291fd4e6fbb"
};

setLogLevel('silent');
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

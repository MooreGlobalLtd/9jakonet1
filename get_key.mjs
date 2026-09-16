import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkxGlvAG362J0yUBJLKpZp3BGy57vBY38",
  authDomain: "jakonet-c751d.firebaseapp.com",
  projectId: "jakonet-c751d",
  storageBucket: "jakonet-c751d.firebasestorage.app",
  messagingSenderId: "914813535202",
  appId: "1:914813535202:web:25371248645291fd4e6fbb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDoc(doc(db, 'system_config', 'paystack'));
  if (snap.exists()) {
    console.log('PUBLIC:', snap.data().publicKey);
    console.log('SECRET:', snap.data().secretKey);
  } else {
    console.log('No paystack doc found');
  }
  process.exit(0);
}
run();

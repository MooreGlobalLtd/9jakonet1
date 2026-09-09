import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

// Read firebase config
const code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
const configMatch = code.match(/const firebaseConfig = ({[\s\S]*?});/);
if (configMatch) {
  let configStr = configMatch[1]
    .replace(/import\.meta\.env\.VITE_FIREBASE_API_KEY/g, `"${process.env.VITE_FIREBASE_API_KEY}"`)
    .replace(/import\.meta\.env\.VITE_FIREBASE_AUTH_DOMAIN/g, `"${process.env.VITE_FIREBASE_AUTH_DOMAIN}"`)
    .replace(/import\.meta\.env\.VITE_FIREBASE_PROJECT_ID/g, `"${process.env.VITE_FIREBASE_PROJECT_ID}"`)
    .replace(/import\.meta\.env\.VITE_FIREBASE_STORAGE_BUCKET/g, `"${process.env.VITE_FIREBASE_STORAGE_BUCKET}"`)
    .replace(/import\.meta\.env\.VITE_FIREBASE_MESSAGING_SENDER_ID/g, `"${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID}"`)
    .replace(/import\.meta\.env\.VITE_FIREBASE_APP_ID/g, `"${process.env.VITE_FIREBASE_APP_ID}"`);

  // It's JSON-like but without quotes around keys. We can eval it.
  const firebaseConfig = eval("(" + configStr + ")");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  async function test() {
    const snap = await getDocs(collection(db, 'users'));
    console.log("Users in DB:");
    snap.docs.forEach(d => {
       console.log(d.id, "=> isKycVerified:", d.data().isKycVerified, "kyc:", d.data().kyc);
    });
  }
  test().catch(console.error);
}

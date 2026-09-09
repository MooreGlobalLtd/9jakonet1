import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

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

  const firebaseConfig = eval("(" + configStr + ")");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  async function test() {
    const snap = await getDocs(collection(db, 'users'));
    console.log("--- USER KYC STATUSES ---");
    snap.docs.forEach(d => {
       const data = d.data();
       if (data.email) {
          console.log(`User: ${data.email} | isKycVerified: ${data.isKycVerified} | kyc object: ${JSON.stringify(data.kyc)}`);
       }
    });
    process.exit(0);
  }
  test().catch(console.error);
}

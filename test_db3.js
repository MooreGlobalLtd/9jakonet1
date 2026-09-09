import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
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
    console.log("Forcing a write to the DB...");
    const testUserId = "zB8y7Rz1s7P0P3E46T932mGZ3Tj2"; // this is a fake or real ID? Let's just update Samuel Ayorinde.
    const snap = await getDocs(collection(db, 'users'));
    let target = snap.docs.find(d => d.data().email === 'engrsamuelayorinde@gmail.com');
    if (target) {
       console.log("Found target:", target.id);
       await setDoc(doc(db, 'users', target.id), {
         isKycVerified: true,
         kyc: { status: 'verified', verifiedAt: Date.now() }
       }, { merge: true });
       console.log("Successfully wrote to DB!");
       
       const check = await getDoc(doc(db, 'users', target.id));
       console.log("Check DB:", check.data().kyc);
    } else {
       console.log("User not found.");
    }
    process.exit(0);
  }
  test().catch(console.error);
}

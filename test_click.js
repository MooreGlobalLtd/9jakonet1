import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
const configMatch = code.match(/const firebaseConfig = ({[\s\S]*?});/);
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

async function testClick() {
  const userId = "zB8y7Rz1s7P0P3E46T932mGZ3Tj2"; // We used this earlier, but let's query a user.
  const snap = await getDocs(collection(db, 'users'));
  const users = snap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const targetUser = users[0];
  console.log("Target:", targetUser.email);
  
  try {
    const payload = {
      isKycVerified: true,
      kyc: {
        status: 'verified',
        verifiedAt: Date.now(),
        rejectReason: ''
      }
    };
    
    await setDoc(doc(db, 'users', targetUser.id), payload, { merge: true });
    console.log("Write success!");
  } catch (err) {
    console.error("Write failed:", err);
  }
  process.exit(0);
}
testClick();

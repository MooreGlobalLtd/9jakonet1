import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from 'fs';

const code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
const configMatch = code.match(/const firebaseConfig = ({[\s\S]*?});/);
if (configMatch) {
  const configStr = configMatch[1]
    .replace(/import\.meta\.env\.VITE_FIREBASE_API_KEY/g, `"${process.env.VITE_FIREBASE_API_KEY}"`)
    .replace(/import\.meta\.env\.VITE_FIREBASE_PROJECT_ID/g, `"${process.env.VITE_FIREBASE_PROJECT_ID}"`)
    // etc... this is tedious. Let's just do it dynamically.
}

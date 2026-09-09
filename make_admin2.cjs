const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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
  try {
    const snap = await getDocs(collection(db, 'users'));
    let found = false;
    
    // gather promises to await them properly so script exits
    const updates = [];
    
    snap.forEach(document => {
      const data = document.data();
      console.log("Found user:", data.email, "| Current role:", data.role);
      
      const p = updateDoc(doc(db, 'users', document.id), { role: 'admin' });
      updates.push(p);
      console.log("Made", data.email, "an admin!");
      found = true;
    });
    
    await Promise.all(updates);
    
    if (!found) {
      console.log("No users found in the database yet.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();

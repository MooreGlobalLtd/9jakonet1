const fs = require('fs');
let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

const target = `      // 4. Update Job status in Firestore
      await updateDoc(doc(db, 'jobs', job.id), {`;

const replacement = `      // 3b. Update Artisan's Wallet Balance (Prototype Money)
      await updateDoc(doc(db, 'users', job.artisanId), {
        walletBalance: increment(artisanPayout)
      });

      // 4. Update Job status in Firestore
      await updateDoc(doc(db, 'jobs', job.id), {`;

file = file.replace(target, replacement);
fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);
console.log("Patched JobsAndEscrow to increment wallet balance");

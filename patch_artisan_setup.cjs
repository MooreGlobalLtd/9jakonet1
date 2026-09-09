const fs = require('fs');
let file = fs.readFileSync('src/pages/ArtisanSetup.tsx', 'utf-8');

// Replace updateDoc with setDoc
file = file.replace(/updateDoc\(doc/g, "setDoc(doc");
file = file.replace("import { doc, updateDoc } from 'firebase/firestore';", "import { doc, setDoc } from 'firebase/firestore';");

// Add merge: true
file = file.replace(/tradeCategory: trade,\n\s*yearsExp: parseInt\(exp\),\n\s*serviceAreas: \[location\],\n\s*}\)/g, "tradeCategory: trade,\n            yearsExp: parseInt(exp),\n            serviceAreas: [location],\n          }, { merge: true })");

// Replace alert with toast
if (!file.includes("import { toast } from 'sonner';")) {
  file = file.replace("import { Input } from '../components/ui/input';", "import { Input } from '../components/ui/input';\nimport { toast } from 'sonner';");
}
file = file.replace(/alert\("Failed to update profile"\);/g, 'toast.error("Failed to update profile");');

fs.writeFileSync('src/pages/ArtisanSetup.tsx', file);
console.log("Patched ArtisanSetup.tsx");

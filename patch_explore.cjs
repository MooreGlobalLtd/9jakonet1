const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

file = file.replace(/import \{ collection, query, where, getDocs \} from 'firebase\/firestore';/, "import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';");

fs.writeFileSync('src/pages/Explore.tsx', file);

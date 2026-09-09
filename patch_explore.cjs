const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

file = file.replace(/const user = usersMap\.get\(profile\.userId\);/g, "const user = usersMap.get(profile.userId || doc.id);");
file = file.replace(/return { \.\.\.profile, user };/g, "return { ...profile, userId: profile.userId || doc.id, user };");

fs.writeFileSync('src/pages/Explore.tsx', file);
console.log("Patched Explore.tsx");

const fs = require('fs');
let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

if (!content.includes("import { toast } from 'sonner';")) {
  content = "import { toast } from 'sonner';\n" + content;
}

content = content.replace(
  "Array.from(e.target.files || [])",
  "Array.from(e.target.files || []) as File[]"
);

fs.writeFileSync('src/pages/Profile.tsx', content);

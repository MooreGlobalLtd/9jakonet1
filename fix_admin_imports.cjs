const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

if (!file.includes("import { toast }")) {
  file = file.replace(
    "import { withTimeout } from '../lib/timeout';",
    "import { withTimeout } from '../lib/timeout';\nimport { toast } from 'sonner';"
  );
}

if (!file.includes("const [copiedId, setCopiedId]")) {
  file = file.replace(
    "const [userSearchTerm, setUserSearchTerm] = useState('');",
    "const [userSearchTerm, setUserSearchTerm] = useState('');\n  const [copiedId, setCopiedId] = useState<string | null>(null);"
  );
}

if (!file.includes("const handleCopy =")) {
  file = file.replace(
    "const markWithdrawalComplete = async (withdrawalId: string) => {",
    `const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.info("Copied to clipboard!");
  };

  const markWithdrawalComplete = async (withdrawalId: string) => {`
  );
}

// I also need to replace `handleRejectWithdrawal` to `rejectWithdrawal` maybe?
if (!file.includes("const handleRejectWithdrawal")) {
  // Let's check what it's actually called.
  // We'll replace handleRejectWithdrawal with handleRejectWithdrawal function definition, or fix the name.
}
fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Fixed Admin imports");

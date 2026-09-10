const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

file = file.replace(
  /const found = NIGERIAN_BANKS\.find\(b => b\.name === e\.target\.value\);\s*if \(found\) setSelectedBankCode\(found\.code\);/g,
  `const found = NIGERIAN_BANKS.find(b => b === e.target.value);
   if (found) setSelectedBankCode('');`
);

file = file.replace(
  /\{NIGERIAN_BANKS\.map\(\(b, i\) => \(\s*<option key=\{i\} value=\{b\.name\}>\{b\.name\}<\/option>\s*\)\)\}/g,
  `{NIGERIAN_BANKS.map((b, i) => (
      <option key={i} value={b}>{b}</option>
   ))}`
);

fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Fixed NIGERIAN_BANKS type issue");

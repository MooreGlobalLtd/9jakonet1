const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

// 1. Remove the static banner entirely
const bannerRegex = /\{\/\* Linked Bank Card for Automatic Escrow Payouts \*\/\}.*?<\/div>\s*\{\/\* Bank Details Form \*\/\}/s;
file = file.replace(bannerRegex, '{/* Bank Details Form */}');

// 2. Fix the select dropdown to use `banks` instead of `NIGERIAN_BANKS`
const selectRegex = /<select[\s\S]*?<\/select>/s;
const newSelect = `<select 
                          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={bankName}
                          onChange={(e) => {
                            setBankName(e.target.value);
                            const found = banks.find(b => b.name === e.target.value);
                            if (found) setSelectedBankCode(found.code);
                          }}
                          required
                        >
                          <option value="">Select Bank...</option>
                          {banks.map((b, i) => (
                            <option key={i} value={b.name}>{b.name}</option>
                          ))}
                        </select>`;
file = file.replace(selectRegex, newSelect);

fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Fixed Wallet UI and dropdown");

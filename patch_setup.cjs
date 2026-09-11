const fs = require('fs');
let code = fs.readFileSync('src/pages/ArtisanSetup.tsx', 'utf8');

// 1. Add state variable
code = code.replace("const [address, setAddress] = useState('');", "const [address, setAddress] = useState('');\n  const [whatsapp, setWhatsapp] = useState('');");

// 2. Add to setDoc
const targetDoc = `            userId: user.id,
            tradeCategory: trade,
            yearsExp: parseInt(exp),
            serviceAreas: [fullLocation],
            state,
            city,
            address`;
const replacementDoc = `            userId: user.id,
            tradeCategory: trade,
            yearsExp: parseInt(exp),
            serviceAreas: [fullLocation],
            state,
            city,
            address,
            whatsappNumber: whatsapp`;
code = code.replace(targetDoc, replacementDoc);

// 3. Add UI field
const targetUI = `              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Years of Experience</label>
                <Input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="e.g. 5"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                />
              </div>
            </div>`;
const replacementUI = `              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Years of Experience</label>
                <Input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="e.g. 5"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp Number</label>
                <p className="text-xs text-slate-500 mb-2">This is only shown to customers AFTER they hire you and create an active job offer, protecting your privacy.</p>
                <Input 
                  type="tel" 
                  required 
                  placeholder="e.g. 08012345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>`;
code = code.replace(targetUI, replacementUI);

fs.writeFileSync('src/pages/ArtisanSetup.tsx', code);
console.log("ArtisanSetup patched");

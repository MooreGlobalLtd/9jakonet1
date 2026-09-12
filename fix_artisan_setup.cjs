const fs = require('fs');
let code = fs.readFileSync('src/pages/ArtisanSetup.tsx', 'utf8');

// 1. Get the store which has artisanProfile
code = code.replace(
  "const { user, init } = useAuthStore();",
  "const { user, artisanProfile, init } = useAuthStore();"
);

// 2. Add bio state and initialize from existing profile
code = code.replace(
  "const [trade, setTrade] = useState('');",
  `const [trade, setTrade] = useState(artisanProfile?.tradeCategory || '');
  const [bio, setBio] = useState(artisanProfile?.bio || '');`
);

code = code.replace(
  "const [exp, setExp] = useState('');",
  "const [exp, setExp] = useState(artisanProfile?.yearsExp?.toString() || '');"
);

code = code.replace(
  "const [state, setState] = useState('');",
  "const [state, setState] = useState((artisanProfile as any)?.state || '');"
);

code = code.replace(
  "const [city, setCity] = useState('');",
  "const [city, setCity] = useState((artisanProfile as any)?.city || '');"
);

code = code.replace(
  "const [address, setAddress] = useState('');",
  "const [address, setAddress] = useState((artisanProfile as any)?.address || '');"
);

code = code.replace(
  "const [whatsapp, setWhatsapp] = useState('');",
  "const [whatsapp, setWhatsapp] = useState(artisanProfile?.whatsappNumber || '');"
);

// 3. Add bio to the Firestore save payload
code = code.replace(
  "whatsappNumber: whatsapp",
  "whatsappNumber: whatsapp,\n            bio: bio"
);

// 4. Add the Bio input field into the JSX
const bioField = `
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">About Me / Bio</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Tell customers a bit about your experience, your work ethic, and why they should hire you..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>
`;

code = code.replace(
  "              <div>\n                <label className=\"mb-1 block text-sm font-medium text-slate-700\">WhatsApp Number</label>",
  bioField + "\n              <div>\n                <label className=\"mb-1 block text-sm font-medium text-slate-700\">WhatsApp Number</label>"
);

fs.writeFileSync('src/pages/ArtisanSetup.tsx', code);
console.log('Fixed ArtisanSetup.tsx');

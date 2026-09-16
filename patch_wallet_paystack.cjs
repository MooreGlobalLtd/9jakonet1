const fs = require('fs');
let content = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

// Patch 1: fetch banks
const target1 = `  useEffect(() => {
    // Fetch banks from backend API
    fetch('/api/banks')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.banks) {
          setBanks(data.banks);
        }
      })
      .catch(err => console.error('Failed to load banks:', err));
  }, []);`;

const replacement1 = `  useEffect(() => {
    const fetchBanks = async () => {
      let secretKey = '';
      try {
        const snap = await getDoc(doc(db, 'system_config', 'paystack'));
        if (snap.exists()) {
          secretKey = snap.data().secretKey || '';
        }
      } catch (e) {}

      fetch('/api/banks', {
        headers: secretKey ? { 'x-paystack-secret-key': secretKey } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.banks) {
            setBanks(data.banks);
          }
        })
        .catch(err => console.error('Failed to load banks:', err));
    };
    fetchBanks();
  }, []);`;

// Patch 2: resolve account
const target2 = `    try {
      const res = await fetch('/api/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBankCode
        })
      });`;

const replacement2 = `    try {
      let secretKey = '';
      try {
        const snap = await getDoc(doc(db, 'system_config', 'paystack'));
        if (snap.exists()) {
          secretKey = snap.data().secretKey || '';
        }
      } catch (e) {}

      const res = await fetch('/api/resolve-account', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(secretKey ? { 'x-paystack-secret-key': secretKey } : {})
        },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBankCode
        })
      });`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
fs.writeFileSync('src/pages/Wallet.tsx', content);

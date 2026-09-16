const fs = require('fs');
let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

const target = `      setIsPosting(false);
      
      // Reset form
      setTitle('');`;

const replacement = `      setIsPosting(false);
      
      // Check if they have a bank set up
      const bankName = userDoc.exists() ? userDoc.data().bankName : null;
      if (!bankName || bankName === 'Not Set' || bankName === '') {
        setTimeout(() => {
          alert('Item Posted! IMPORTANT: Please click the "Bank Details" button in the marketplace to add your bank account. You cannot receive payments from buyers without it!');
        }, 500);
      }
      
      // Reset form
      setTitle('');`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Marketplace.tsx', content);

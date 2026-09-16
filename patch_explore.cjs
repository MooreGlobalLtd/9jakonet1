const fs = require('fs');
let content = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const target = `  const handleMessageArtisan = async (artisanId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if chat already exists`;

const replacement = `  const handleMessageArtisan = async (artisanId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!user.isKycVerified) {
      alert("You must complete identity verification (KYC) before you can contact and hire artisans.");
      return;
    }
    
    // Check if chat already exists`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Explore.tsx', content);

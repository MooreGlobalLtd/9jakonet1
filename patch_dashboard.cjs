const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const target = `  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const newJob = {`;

const replacement = `  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!user.isKycVerified) {
      alert("You must complete your identity verification (KYC) before you can post jobs.");
      return;
    }
    
    try {
      const newJob = {`;

content = content.replace(target, replacement);

const targetBtn = `<Button onClick={() => setShowJobForm(!showJobForm)}>
            {showJobForm ? 'Cancel' : 'Post New Job'}
          </Button>`;

const replacementBtn = `<Button onClick={() => {
            if (!user.isKycVerified) {
              alert("You must complete your identity verification (KYC) before you can post jobs.");
              return;
            }
            setShowJobForm(!showJobForm);
          }}>
            {showJobForm ? 'Cancel' : 'Post New Job'}
          </Button>`;

content = content.replace(targetBtn, replacementBtn);

fs.writeFileSync('src/pages/Dashboard.tsx', content);

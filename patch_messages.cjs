const fs = require('fs');
let content = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

const target = `                    <Button 
                      size="sm" 
                      onClick={() => {
                        // Quick fallback to simple inline UI since prompt is blocked
                        const jobForm = document.getElementById('quick-job-form');`;

const replacement = `                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (!user.isKycVerified) {
                          alert("You must complete your KYC verification before you can send a job offer or initiate Escrow.");
                          return;
                        }
                        // Quick fallback to simple inline UI since prompt is blocked
                        const jobForm = document.getElementById('quick-job-form');`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Messages.tsx', content);

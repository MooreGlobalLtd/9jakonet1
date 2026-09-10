const fs = require('fs');

let file = fs.readFileSync('server.ts', 'utf-8');

// Resend free tier has extreme restrictions and sometimes fails silently if the 'to' address isn't EXACTLY the verified email.
// To make it foolproof, let's catch the Resend error and log it to the console so we know exactly why it's failing.

const oldBlock = `
    try {
      const data = await resend.emails.send({
        from: '9jaKonet <onboarding@resend.dev>', // Free tier default, must be onboarding@resend.dev until custom domain is verified
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      });

      res.json({ success: true, data });
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
`;

const newBlock = `
    try {
      const data = await resend.emails.send({
        from: '9jaKonet <onboarding@resend.dev>', // Free tier default, must be onboarding@resend.dev until custom domain is verified
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      });

      if (data.error) {
        console.error('Resend API returned an error:', data.error);
        return res.status(400).json({ success: false, error: data.error.message || 'Resend rejected the email' });
      }

      console.log('Successfully sent email via Resend:', data);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Exception thrown while sending email via Resend:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to send email' });
    }
`;

file = file.replace(oldBlock.trim(), newBlock.trim());

fs.writeFileSync('server.ts', file);
console.log("Patched server.ts with better error logging");

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body || {};
  
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Simulating email send:', { to, subject });
    return res.status(200).json({ 
      success: true, 
      message: 'Simulated email sent (API key missing)',
      simulated: true 
    });
  }

  try {
    const data = await resend.emails.send({
      from: '9jaKonet <hello@9jakonet.mooregloballtd.online>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

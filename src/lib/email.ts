export async function sendEmail({ to, subject, html }: { to: string | string[], subject: string, html: string }) {
  try {
    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    return null;
  }
}

import React from 'react';

export default function Privacy() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 font-sans">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-emerald max-w-none text-slate-600 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Location Data</h2>
        <p>If you permit the 9jaKonet app to access location services through the permission system used by your mobile operating system or browser, we may collect the precise location of your device when the app is running in the foreground or background to help connect you with nearby professionals.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide, maintain, and improve our Services.</li>
          <li>To process transactions securely via Paystack.</li>
          <li>To send you administrative messages, support updates, and escrow notifications.</li>
          <li>To verify artisan identities and maintain platform trust.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Sharing of Information</h2>
        <p>We do not sell your personal data. We may share your information with vendors, consultants, marketing partners, and other service providers who need access to such information to carry out work on our behalf (e.g., identity verification services, payment processors).</p>
      </div>
    </div>
  );
}

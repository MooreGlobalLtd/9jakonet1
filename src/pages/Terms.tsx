import React from 'react';

export default function Terms() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 font-sans">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      <div className="prose prose-emerald max-w-none text-slate-600 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using 9jaKonet, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Description of Service</h2>
        <p>9jaKonet provides an online marketplace connecting customers with verified local artisans and professionals in Nigeria. We act as a facilitator and provide an escrow payment system to secure transactions.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. User Conduct and Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Users must provide accurate, current, and complete information during registration.</li>
          <li>Artisans must possess the necessary skills and licenses for the services they offer.</li>
          <li>Users agree not to use the platform for any illegal or unauthorized purpose.</li>
          <li>All payments for services booked through 9jaKonet must be processed through our secure Escrow system to ensure protection for both parties.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Limitation of Liability</h2>
        <p>While we rigorously verify our professionals, 9jaKonet shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or the inability to use the service or for cost of procurement of substitute goods and services.</p>
      </div>
    </div>
  );
}

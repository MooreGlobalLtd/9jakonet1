import React from 'react';

export default function EscrowPolicy() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 font-sans">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Escrow Policy</h1>
      <div className="prose prose-emerald max-w-none text-slate-600 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. How the Escrow Works</h2>
        <p>At 9jaKonet, we prioritize the financial safety of both our customers and our artisans. When a customer agrees to hire an artisan, the customer pays the agreed amount into the 9jaKonet Escrow Vault via our secure payment partner, Paystack.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Funds Security</h2>
        <p>Once funded, the money is securely locked. The artisan receives an immediate notification that the funds are secured and they can confidently commence work. The customer cannot unilaterally withdraw the funds once the job has started.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Releasing Funds</h2>
        <p>Funds are only released to the artisan's wallet when the customer marks the job as "Completed" and confirms they are 100% satisfied with the work done.</p>

        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Dispute Resolution</h2>
        <p>If there is a disagreement regarding the quality or completion of the work:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>The funds remain locked in the Escrow Vault.</li>
            <li>Either party can open a dispute ticket from their dashboard.</li>
            <li>A 9jaKonet arbitration specialist will review evidence (chat history, photos of work) from both parties.</li>
            <li>The specialist will make a binding decision to either refund the customer, pay the artisan, or split the funds based on the work completed.</li>
          </ul>
        </p>
      </div>
    </div>
  );
}

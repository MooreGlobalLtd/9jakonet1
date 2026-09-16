const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

// Add ShoppingBag icon import
if (!content.includes('ShoppingBag')) {
  content = content.replace("import { ShieldCheck, Search, Clock, CheckCircle, AlertTriangle, KeyRound, ArrowRight, RefreshCw, Banknote } from 'lucide-react';", "import { ShieldCheck, Search, Clock, CheckCircle, AlertTriangle, KeyRound, ArrowRight, RefreshCw, Banknote, ShoppingBag } from 'lucide-react';");
}

// Update the job card rendering
const cardStartTarget = `<Card key={job.id} className="overflow-hidden border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-slate-900 text-sm">Escrow Protected Contract</span>
                </div>`;

const cardStartReplace = `<Card key={job.id} className="overflow-hidden border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {job.contractType === 'product' ? (
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  )}
                  <span className="font-semibold text-slate-900 text-sm">
                    {job.contractType === 'product' ? 'Product Escrow Order' : 'Escrow Protected Contract'}
                  </span>
                </div>`;

content = content.replace(cardStartTarget, cardStartReplace);

// Update title and role display
const titleTarget = `<h3 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h3>
                    <p className="text-slate-500 text-sm">
                      {user.role === 'customer' 
                        ? \`Artisan: \${job.artisanName}\` 
                        : \`Customer: \${job.customerName}\`}
                    </p>`;

const titleReplace = `<h3 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h3>
                    <div className="text-slate-500 text-sm space-y-1">
                      {user.role === 'customer' || user.id === job.customerId ? (
                        <p>{job.contractType === 'product' ? 'Seller' : 'Artisan'}: {job.artisanName}</p>
                      ) : (
                        <p>Buyer: {job.customerName}</p>
                      )}
                      {job.contractType === 'product' && job.deliveryAddress && (
                         <p className="text-slate-600"><strong>Delivery Address:</strong> {job.deliveryAddress} {job.buyerPhone && \`| Phone: \${job.buyerPhone}\`}</p>
                      )}
                      {job.contractType === 'product' && (job.trackingNumber || user.id === job.artisanId) && (
                         <div className="mt-2 p-2 bg-slate-100 rounded text-xs flex gap-2 items-center">
                           <strong>Tracking:</strong> 
                           {job.trackingNumber ? (
                             <span>{job.trackingNumber}</span>
                           ) : (
                             user.id === job.artisanId ? <span className="text-amber-600">Please provide tracking/delivery info via Chat</span> : <span className="text-slate-400">Not provided yet</span>
                           )}
                         </div>
                      )}
                    </div>`;

content = content.replace(titleTarget, titleReplace);

// Update "Completed" text to support products
const completedTarget = `job.status === 'completed' && (
                    <div className="w-full md:w-auto bg-emerald-50 text-emerald-700 h-10 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 border border-emerald-100">
                      <CheckCircle className="h-4 w-4" />
                      Job Completed
                    </div>
                  )`;
const completedReplace = `job.status === 'completed' && (
                    <div className="w-full md:w-auto bg-emerald-50 text-emerald-700 h-10 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 border border-emerald-100">
                      <CheckCircle className="h-4 w-4" />
                      {job.contractType === 'product' ? 'Order Delivered' : 'Job Completed'}
                    </div>
                  )`;

content = content.replace(completedTarget, completedReplace);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

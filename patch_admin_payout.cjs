const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Patch 1: markWithdrawalComplete
const oldMarkComplete = `
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'completed',
        transferStatus: 'manual_transfer',
        paidAt: Date.now()
      });

      // Add to transactions log
`;
const newMarkComplete = `
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'completed',
        transferStatus: 'manual_transfer',
        paidAt: Date.now()
      });
      
      // Deduct from artisan's prototype wallet balance since it's paid out
      try {
        await updateDoc(doc(db, 'users', withdrawalDoc.userId), {
          walletBalance: increment(-withdrawalDoc.amount)
        });
      } catch(e) {
        console.error('Failed to deduct wallet balance:', e);
      }

      // Add to transactions log
`;
file = file.replace(oldMarkComplete, newMarkComplete);

// Patch 2: executePaystackWithdrawal
const oldPaystackComplete = `
          await updateDoc(doc(db, 'withdrawals', w.id), {
            status: 'completed',
            transferCode: data.transferCode,
            reference: data.reference,
            transferStatus: data.status || 'success',
            paidAt: Date.now()
          });

          // Add to transactions log
`;
const newPaystackComplete = `
          await updateDoc(doc(db, 'withdrawals', w.id), {
            status: 'completed',
            transferCode: data.transferCode,
            reference: data.reference,
            transferStatus: data.status || 'success',
            paidAt: Date.now()
          });

          // Deduct from artisan's prototype wallet balance
          try {
            await updateDoc(doc(db, 'users', w.userId), {
              walletBalance: increment(-w.amount)
            });
          } catch(e) {
            console.error('Failed to deduct wallet balance:', e);
          }

          // Add to transactions log
`;
file = file.replace(oldPaystackComplete, newPaystackComplete);

// Patch 3: UI to use reqUser's bank info if available
const oldWithdrawalCard = `
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-xl">₦{w.amount.toLocaleString()}</p>
                          <p className="font-semibold text-slate-800">{reqUser?.displayName || w.accountName || 'Artisan Partner'}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(w.createdAt)}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <Button 
                            size="sm" 
                            type="button" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer flex items-center gap-1.5"
                            disabled={isProcessing}
                            onClick={() => executePaystackWithdrawal(w)}
                          >
                            {isProcessing ? 'Transferring...' : '⚡ Pay via Paystack'}
                          </Button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => markWithdrawalComplete(w.id)}
                              className="text-xs text-slate-600 hover:text-slate-900 underline"
                            >
                              Mark Paid Manually
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => handleRejectWithdrawal(w.id, w.userId, w.amount)}
                              className="text-xs text-red-600 hover:text-red-700 underline"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">Bank</p>
                          <p className="text-sm font-medium text-slate-900">{w.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-slate-900">{w.accountNumber}</p>
                            {w.accountNumber !== 'Not Set' && (
                              <button 
                                onClick={() => handleCopy(w.accountNumber, w.id)}
                                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-200"
                                type="button"
                              >
                                {copiedId === w.id ? <CheckCircle className="h-3 w-3" /> : 'Copy'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">Verified Account Name</p>
                          <p className="text-sm font-medium text-slate-900">{w.accountName}</p>
                        </div>
                      </div>
`;

const newWithdrawalCard = `
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-xl">₦{w.amount.toLocaleString()}</p>
                          <p className="font-semibold text-slate-800">{reqUser?.displayName || w.accountName || 'Artisan Partner'}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(w.createdAt)}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <Button 
                            size="sm" 
                            type="button" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer flex items-center gap-1.5"
                            disabled={isProcessing}
                            onClick={() => {
                              // Dynamically pass updated bank details if the record was missing them
                              const updatedW = {
                                ...w, 
                                bankName: (w.bankName === 'Not Set' || w.bankName === 'N/A') ? reqUser?.bankName || w.bankName : w.bankName,
                                accountNumber: (w.accountNumber === 'Not Set' || w.accountNumber === 'N/A') ? reqUser?.accountNumber || w.accountNumber : w.accountNumber,
                                accountName: (w.accountName === w.artisanName) ? reqUser?.accountName || w.accountName : w.accountName
                              };
                              executePaystackWithdrawal(updatedW);
                            }}
                          >
                            {isProcessing ? 'Transferring...' : '⚡ Pay via Paystack'}
                          </Button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => markWithdrawalComplete(w.id)}
                              className="text-xs text-slate-600 hover:text-slate-900 underline"
                            >
                              Mark Paid Manually
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => handleRejectWithdrawal(w.id, w.userId, w.amount)}
                              className="text-xs text-red-600 hover:text-red-700 underline"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">Bank</p>
                          <p className="text-sm font-medium text-slate-900">{(w.bankName === 'Not Set' || w.bankName === 'N/A') ? reqUser?.bankName || 'Not Set' : w.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-slate-900">{(w.accountNumber === 'Not Set' || w.accountNumber === 'N/A') ? reqUser?.accountNumber || 'Not Set' : w.accountNumber}</p>
                            {((w.accountNumber !== 'Not Set' && w.accountNumber !== 'N/A') || reqUser?.accountNumber) && (
                              <button 
                                onClick={() => handleCopy(((w.accountNumber === 'Not Set' || w.accountNumber === 'N/A') ? reqUser?.accountNumber : w.accountNumber) || '', w.id)}
                                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-200"
                                type="button"
                              >
                                {copiedId === w.id ? <CheckCircle className="h-3 w-3" /> : 'Copy'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">Verified Account Name</p>
                          <p className="text-sm font-medium text-slate-900">{w.accountName === w.artisanName ? reqUser?.accountName || w.accountName : w.accountName}</p>
                        </div>
                      </div>
`;
file = file.replace(oldWithdrawalCard, newWithdrawalCard);

// Make sure markWithdrawalComplete also grabs the updated bank details to show in the confirmation alert
const oldMarkConfirm = `
      if (!confirm(\`Confirm you have sent ₦\${withdrawalDoc.amount.toLocaleString()} to \${withdrawalDoc.accountName || 'the artisan'} (\${withdrawalDoc.bankName} - \${withdrawalDoc.accountNumber})?\`)) {
`;
const newMarkConfirm = `
      const artisanData = users.find(u => u.id === withdrawalDoc.userId);
      const displayBank = (withdrawalDoc.bankName === 'Not Set' || withdrawalDoc.bankName === 'N/A') ? artisanData?.bankName || 'Unknown Bank' : withdrawalDoc.bankName;
      const displayAccount = (withdrawalDoc.accountNumber === 'Not Set' || withdrawalDoc.accountNumber === 'N/A') ? artisanData?.accountNumber || 'Unknown Account' : withdrawalDoc.accountNumber;
      const displayName = (withdrawalDoc.accountName === withdrawalDoc.artisanName) ? artisanData?.accountName || withdrawalDoc.accountName : withdrawalDoc.accountName;
      
      if (!confirm(\`Confirm you have sent ₦\${withdrawalDoc.amount.toLocaleString()} to \${displayName || 'the artisan'} (\${displayBank} - \${displayAccount})?\`)) {
`;
file = file.replace(oldMarkConfirm, newMarkConfirm);

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Patched AdminDashboard payout logic and UI");

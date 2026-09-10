const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

// The block we want to replace starts with:
// {/* Withdraw Funds Form */}
// And ends at:
//           )}
//         </div>
//       </div>

// Let's use regex to replace it entirely

const regex = /\{\/\* Withdraw Funds Form \*\/\}.*?<\/form>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>/s;

const replacement = `      {/* Bank Details Form */}
      <div className="grid md:grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Direct Escrow Payout Bank</h3>
          {isCustomer ? (
            <div className="text-center text-slate-500 py-4">
              Customers cannot receive escrow payouts. You can only fund escrows for jobs.
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-6">
                Set your verified bank account below. When a customer releases escrow funds, the 90% payout is automatically queued and disbursed to this bank account by the admin.
              </p>
              <div className="max-w-xl">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                      <div className="relative">
                        <select 
                          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={bankName}
                          onChange={(e) => {
                            setBankName(e.target.value);
                            const found = NIGERIAN_BANKS.find(b => b.name === e.target.value);
                            if (found) setSelectedBankCode(found.code);
                          }}
                          required
                        >
                          <option value="">Select Bank...</option>
                          {NIGERIAN_BANKS.map((b, i) => (
                            <option key={i} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                      <div className="relative">
                        <Input 
                          type="text" 
                          placeholder="e.g. 0123456789"
                          maxLength={10}
                          className="h-12"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\\D/g, ''))}
                          required
                        />
                      </div>
                      {verifyingAccount ? (
                        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Verifying account...
                        </div>
                      ) : accountVerified && resolvedAccountName ? (
                        <div className="mt-2 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1.5 rounded-md flex items-start gap-1.5 border border-emerald-100">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span className="leading-snug">Account Name: {resolvedAccountName}</span>
                        </div>
                      ) : verificationError ? (
                        <div className="mt-2 text-xs text-red-600 font-medium">
                          {verificationError}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <Button 
                      type="button"
                      onClick={handleSaveBankDetails}
                      className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={savingBank || !accountVerified}
                    >
                      {savingBank ? 'Saving...' : 'Save Bank for Direct Payouts'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Regex replaced Wallet.tsx");

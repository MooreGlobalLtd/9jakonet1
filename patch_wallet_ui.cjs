const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

// Replace the Withdraw Wallet Balance card entirely with just a Bank Account card
const oldCard = `      {/* Withdraw Funds Form */}
      <div className="grid md:grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="text-xl font-bold text-slate-900">Withdraw Wallet Balance</h3>
          </div>
          {isCustomer ? (
            <div className="p-8 text-center text-slate-500">
              Customers cannot withdraw funds. You can only fund escrows for jobs.
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-xl">
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Withdraw (₦)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input 
                        type="number"
                        min="100"
                        placeholder="e.g. 10000"
                        className="pl-10 h-12"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Banknote className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                          className="flex h-12 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Banknote className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input 
                          type="text" 
                          placeholder="e.g. 0123456789"
                          maxLength={10}
                          className="pl-9 h-12"
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

                  <div className="flex gap-3 mt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSaveBankDetails}
                      className="flex-1 h-12 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      disabled={savingBank || !accountVerified}
                    >
                      {savingBank ? 'Saving...' : 'Save Bank for Direct Payouts'}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                      disabled={submitting || !user.walletBalance || user.walletBalance <= 0 || !accountVerified}
                    >
                      {submitting ? 'Processing...' : 'Request Withdrawal'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>`;

const newCard = `      {/* Bank Details Form */}
      <div className="grid md:grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Direct Escrow Payout Bank</h3>
          </div>
          {isCustomer ? (
            <div className="p-8 text-center text-slate-500">
              Customers cannot withdraw funds. You can only fund escrows for jobs.
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-xl">
                <p className="text-sm text-slate-600 mb-6">
                  Set your verified bank account below. When a customer releases escrow funds, the 90% payout is automatically queued and disbursed to this bank account by the admin.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Banknote className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                          className="flex h-12 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Banknote className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input 
                          type="text" 
                          placeholder="e.g. 0123456789"
                          maxLength={10}
                          className="pl-9 h-12"
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

                  <div className="flex gap-3 mt-4 pt-2">
                    <Button 
                      type="button"
                      onClick={handleSaveBankDetails}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-white font-medium"
                      disabled={savingBank || !accountVerified}
                    >
                      {savingBank ? 'Saving Account...' : 'Save Bank for Direct Payouts'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>`;

if (!file.includes('Amount to Withdraw (₦)')) {
    console.log("Already patched UI");
} else {
    file = file.replace(oldCard, newCard);
    fs.writeFileSync('src/pages/Wallet.tsx', file);
    console.log("Patched Wallet.tsx UI");
}

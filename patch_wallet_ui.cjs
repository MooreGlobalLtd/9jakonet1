const fs = require('fs');
let content = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

// 1. Remove {!isCustomer && ( ... )} around the Bank Details Form
const bankTarget = `          {!isCustomer && (
            <div className="space-y-6">
              {/* Bank Details Form */}
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
              </p>`;

const bankReplace = `          <div className="space-y-6 mt-6">
              {/* Bank Details Form */}
      <div className="grid md:grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Direct Escrow Payout Bank</h3>
            <div>
              <p className="text-sm text-slate-600 mb-6">
                Set your verified bank account below. When an escrow is released, the payout is automatically queued and disbursed to this bank account.
              </p>`;

content = content.replace(bankTarget, bankReplace);

// We have an open div and closing tags from the old logic that we need to fix. Let's see the end of the bank form:
const bankEndTarget = `              </div>
            </div>
          )}
        </div>
      </div>


      {/* History Sections */}
      {!isCustomer && (
        <div className="mt-12">`;
        
const bankEndReplace = `              </div>
            </div>
        </div>
      </div>
    </div>

      {/* History Sections */}
        <div className="mt-12">`;
        
content = content.replace(bankEndTarget, bankEndReplace);


// Then for the bottom of History Sections:
const historyEndTarget = `          </div>
        </div>
      )}
    </div>`;

const historyEndReplace = `          </div>
        </div>
    </div>`;

content = content.replace(historyEndTarget, historyEndReplace);

fs.writeFileSync('src/pages/Wallet.tsx', content);

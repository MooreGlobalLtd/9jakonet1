const fs = require('fs');

let file = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf-8');

// The block that renders the Paystack button:
const paystackBlock = `<PaystackButton
                        email={user.email}
                        amount={(job.amount || 0) * 100}
                        metadata={{
                          name: user.displayName,
                          phone: user.phone || '',
                          custom_fields: []
                        }}
                        publicKey={paystackPublicKey}
                        text="Fund Escrow"
                        channels={['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'eft']}
                        onSuccess={(ref: any) => handleFundEscrow(job, ref)}
                        onClose={() => console.log("Payment window closed.")}
                        className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
                      />`;

const safePaystackBlock = `
                    {(!paystackPublicKey || paystackPublicKey.trim() === '' || !paystackPublicKey.startsWith('pk_')) ? (
                      <Button 
                        onClick={() => toast.error("Payment Gateway is offline. Please go to the Admin Panel and enter a valid Paystack Public Key.")}
                        className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 py-2 rounded-md font-medium text-sm transition-colors"
                      >
                        Fund Escrow (Setup Required)
                      </Button>
                    ) : (
                      <PaystackButton
                        email={user.email}
                        amount={(job.amount || 0) * 100}
                        metadata={{
                          name: user.displayName,
                          phone: user.phone || '',
                          custom_fields: []
                        }}
                        publicKey={paystackPublicKey}
                        text="Fund Escrow"
                        channels={['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'eft']}
                        onSuccess={(ref: any) => handleFundEscrow(job, ref)}
                        onClose={() => console.log("Payment window closed.")}
                        className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
                      />
                    )}`;

// Wait, we need to find the exact block.
file = file.replace(/<PaystackButton[\s\S]*?className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"[\s\S]*?\/>/, safePaystackBlock.trim());

// We also need to fix the fallback key to be completely empty so it forces them to set it, OR a valid test key. 
// Let's just make it empty by default so they know they HAVE to set it in the new DB.
file = file.replace(/localStorage\.getItem\('paystack_public_key'\) \|\| \(import\.meta as any\)\.env\.VITE_PAYSTACK_PUBLIC_KEY \|\| 'pk_live_04b9016335193910cdba3828c46002496a7ef412'/g, "localStorage.getItem('paystack_public_key') || (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || ''");

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', file);
console.log("Patched Paystack Button safely");

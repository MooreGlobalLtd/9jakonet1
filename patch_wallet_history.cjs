const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

const oldHistory = `
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs text-slate-700 whitespace-nowrap font-medium">
                        {formatDateTime(w.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">₦{w.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {w.bankName} <span className="text-slate-400">({w.accountNumber})</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {w.transferCode || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize \${
                          w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          w.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }\`}>
                          {w.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                          {w.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
`;

const newHistory = `
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs text-slate-700 whitespace-nowrap font-medium">
                        {formatDateTime(w.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className={w.status === 'completed' ? 'text-emerald-600' : 'text-slate-900'}>
                          {w.status === 'completed' ? '-' : '+'} ₦{w.amount.toLocaleString()}
                        </span>
                        {w.status === 'completed' && <p className="text-[10px] text-emerald-700 mt-0.5">Paid to Bank</p>}
                        {w.status === 'pending' && <p className="text-[10px] text-amber-600 mt-0.5">Pending Payout</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{w.bankName === 'Not Set' ? (user.bankName || 'Not Set') : w.bankName}</span>
                        <span className="text-slate-500 block font-mono text-xs">{w.accountNumber === 'Not Set' ? (user.accountNumber || '') : w.accountNumber}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {w.transferCode || (w.status === 'completed' ? 'Manual Transfer' : '—')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize \${
                          w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          w.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }\`}>
                          {w.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                          {w.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                          {w.status === 'completed' ? 'Paid Out' : w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
`;
file = file.replace(oldHistory, newHistory);

// Also we should make sure "Wallet Withdrawals" tab defaults to "Escrow Payouts" if it makes more sense, 
// since the user isn't doing manual withdrawals anymore.
file = file.replace(
  `Wallet Withdrawals ({withdrawals.length})`, 
  `Escrow Payouts ({withdrawals.length})`
);
file = file.replace(
  `No manual withdrawals yet.`,
  `No escrow payouts pending or completed.`
);

fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Patched Wallet history UI");

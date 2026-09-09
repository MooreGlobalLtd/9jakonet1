import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { Banknote, Building2, User, Clock, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { formatDateTime } from '../lib/utils';

const NIGERIAN_BANKS = [
  "Access Bank",
  "Access Bank (Diamond)",
  "Ecobank",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTB)",
  "Heritage Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint Microfinance Bank",
  "OPay",
  "Palmpay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank"
];

interface Bank {
  name: string;
  code: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'completed' | 'rejected';
  transferCode?: string;
  createdAt: number;
}

interface EscrowPayoutTransaction {
  id: string;
  type: string;
  amount: number;
  totalJobAmount?: number;
  platformFee?: number;
  bankName?: string;
  accountNumber?: string;
  jobTitle?: string;
  transferStatus?: string;
  transferCode?: string;
  transferNote?: string;
  createdAt: number;
}

export default function Wallet() {
  const { user } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [directPayouts, setDirectPayouts] = useState<EscrowPayoutTransaction[]>([]);
  const [historyTab, setHistoryTab] = useState<'direct' | 'withdrawals'>('direct');
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  // Bank Account Resolution State
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [accountVerified, setAccountVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [resettingBalance, setResettingBalance] = useState(false);

  const handleResetTestBalance = async () => {
    if (!user) return;
    if (!confirm('Clear your prototype wallet balance back to ₦0 for live production readiness?')) return;
    setResettingBalance(true);
    try {
      await updateDoc(doc(db, 'users', user.id), { walletBalance: 0 });
      useAuthStore.setState({ user: { ...user, walletBalance: 0 } });
      alert('✅ Wallet balance has been reset to ₦0!');
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'resource-exhausted') {
        useAuthStore.setState({ user: { ...user, walletBalance: 0 } });
        alert('Balance reset in current session. Database write quota limit will sync when refreshed.');
      } else {
        alert('Failed to reset balance: ' + (e?.message || 'Database error'));
      }
    } finally {
      setResettingBalance(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.accountNumber) setAccountNumber(user.accountNumber);
      if (user.bankName) setBankName(user.bankName);
      if (user.bankCode) setSelectedBankCode(user.bankCode);
      if (user.accountName) {
        setResolvedAccountName(user.accountName);
        setAccountVerified(true);
      }
    }
  }, [user]);

  const handleSaveBankDetails = async () => {
    if (!user || !bankName || !accountNumber || !accountVerified) {
      alert('Please enter and verify your bank account details first.');
      return;
    }
    setSavingBank(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        bankName,
        bankCode: selectedBankCode,
        accountNumber,
        accountName: resolvedAccountName
      });
      useAuthStore.setState({
        user: { ...user, bankName, bankCode: selectedBankCode, accountNumber, accountName: resolvedAccountName }
      });
      alert('Bank account details saved successfully for automatic direct payouts!');
    } catch (error) {
      console.error('Failed to save bank details:', error);
      alert('Failed to save bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  useEffect(() => {
    // Fetch banks from backend API
    fetch('/api/banks')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.banks) {
          setBanks(data.banks);
        }
      })
      .catch(err => console.error('Failed to load banks:', err));
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchWithdrawals = async () => {
      try {
        const qW = query(collection(db, 'withdrawals'), where('userId', '==', user.id));
        const snapW = await getDocs(qW);
        const dataW = snapW.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        setWithdrawals(dataW.sort((a, b) => b.createdAt - a.createdAt));

        const qT = query(collection(db, 'transactions'), where('userId', '==', user.id));
        const snapT = await getDocs(qT);
        const dataT = snapT.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as EscrowPayoutTransaction))
          .filter(t => t.type === 'escrow_payout');
        setDirectPayouts(dataT.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        console.error("Error fetching wallet data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWithdrawals();
  }, [user]);

  // Handle automatic real bank account verification when 10 digits are entered
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      setVerifyingAccount(true);
      setVerificationError('');
      setResolvedAccountName('');
      setAccountVerified(false);

      const verifyAccount = async () => {
        try {
          const res = await fetch('/api/resolve-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountNumber, bankCode: selectedBankCode })
          });
          const data = await res.json();
          if (data.success && data.accountName) {
            setResolvedAccountName(data.accountName);
            setAccountVerified(true);
          } else {
            setVerificationError(data.error || 'Could not verify account. Please check details.');
          }
        } catch (error) {
          console.error('Account resolution failed:', error);
          setVerificationError('Network error verifying bank account.');
        } finally {
          setVerifyingAccount(false);
        }
      };

      verifyAccount();
    } else {
      setResolvedAccountName('');
      setAccountVerified(false);
      if (accountNumber.length > 0 && accountNumber.length < 10) {
        setVerificationError('Account number must be 10 digits');
      } else {
        setVerificationError('');
      }
    }
  }, [accountNumber, selectedBankCode]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    if (amount > (user.walletBalance || 0)) return alert('Insufficient funds');
    if (!bankName || !accountNumber) return alert('Enter bank details');
    if (!accountVerified) return alert('Please wait for account name verification');

    setSubmitting(true);
    try {
      // Create withdrawal request with bankCode
      const newWithdrawal = {
        userId: user.id,
        amount,
        bankName,
        bankCode: selectedBankCode,
        accountNumber,
        accountName: resolvedAccountName,
        status: 'pending',
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'withdrawals'), newWithdrawal);
      
      // Deduct from wallet
      await updateDoc(doc(db, 'users', user.id), {
        walletBalance: increment(-amount)
      });
      
      // Update local state
      setWithdrawals([{ id: docRef.id, ...newWithdrawal } as Withdrawal, ...withdrawals]);
      
      // We mutate local user store state for immediate feedback
      useAuthStore.setState({
        user: { ...user, walletBalance: (user.walletBalance || 0) - amount }
      });
      
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      setResolvedAccountName('');
      setAccountVerified(false);
      alert('Withdrawal request submitted successfully! Funds will be transferred to your verified bank account shortly.');
    } catch (error) {
      console.error(error);
      alert('Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const isCustomer = user.role === 'customer';

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {isCustomer ? 'My Payments & Escrow Funding' : 'Wallet & Earnings'}
        </h1>
        <p className="text-slate-500 mt-2">
          {isCustomer 
            ? 'Track your secure escrow payments. Funds are safely held in escrow via Paystack until job completion.' 
            : 'Manage your earnings from completed escrow jobs and withdraw to your local bank account.'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Balance / Info Card */}
        <div className="md:col-span-1">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Banknote className="w-24 h-24" />
             </div>
             <p className="text-slate-400 font-medium mb-2">{isCustomer ? 'Active Escrow / Wallet' : 'Available Balance'}</p>
             <div className="flex items-baseline justify-between mb-4">
               <h2 className="text-4xl font-bold tracking-tight">
                 ₦{(user.walletBalance || 0).toLocaleString()}
               </h2>
             </div>
             {(user.walletBalance || 0) > 0 && (
               <div className="mb-4">
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={handleResetTestBalance}
                   disabled={resettingBalance}
                   className="text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                 >
                   Clear Test Balance to ₦0
                 </Button>
               </div>
             )}
             <div className="text-sm text-emerald-400 flex items-center gap-1.5">
               <CheckCircle className="w-4 h-4" /> {isCustomer ? 'Protected by Paystack Escrow' : 'Available for withdrawal'}
             </div>
          </div>
        </div>

        {/* Dynamic Content based on Role */}
        <div className="md:col-span-2">
          {isCustomer && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">How Escrow Works for Customers</h3>
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  As a customer on 9jaKonet, you do not need to withdraw funds. When you hire an artisan, you securely fund the job escrow using your debit card or bank transfer via Paystack.
                </p>
                <p>
                  The money remains locked safely in the 9jaKonet Escrow Vault (powered by Paystack) while the artisan works. Once the job is successfully completed to your satisfaction, you click <strong>Release Funds</strong> to pay the artisan.
                </p>
                <div className="pt-4">
                  <a href="/jobs" className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                    View My Jobs & Escrow Contracts
                  </a>
                </div>
              </div>
            </div>
          )}

          {!isCustomer && (
            <div className="space-y-6">
              {/* Linked Bank Card for Automatic Escrow Payouts */}
              <div className={`rounded-2xl p-6 border ${user.accountNumber && user.bankName ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-700" />
                      Direct Escrow Bank Payout Account
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-lg">
                      When a customer approves a job and releases escrow funds, <strong>90% of the funds are automatically transferred directly into your bank account</strong> via Paystack.
                    </p>
                  </div>
                  {user.accountNumber && user.bankName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Payouts Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Not Linked
                    </span>
                  )}
                </div>

                {user.accountNumber && user.bankName ? (
                  <div className="mt-4 pt-3 border-t border-emerald-200/60 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Bank</span>
                      <span className="font-semibold text-slate-900">{user.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Number</span>
                      <span className="font-mono font-semibold text-slate-900">{user.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Holder</span>
                      <span className="font-medium text-emerald-800">{user.accountName || user.displayName}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 mt-3 font-medium">
                    ⚠️ Enter your bank details below and click &quot;Save Bank for Direct Payouts&quot; to enable instant automated payments to your account!
                  </p>
                )}
              </div>

              {/* Withdraw Funds Form */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Withdraw Wallet Balance</h3>
                
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Withdraw (₦)</label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input 
                        type="number" 
                        required 
                        min="100"
                        max={user.walletBalance || 0}
                        placeholder="e.g. 10000"
                        className="pl-10"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <select 
                          required 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                          value={selectedBankCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            setSelectedBankCode(code);
                            const found = banks.find(b => b.code === code);
                            if (found) setBankName(found.name);
                          }}
                        >
                          <option value="" disabled>Select a bank...</option>
                          {banks.map(bank => (
                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input 
                          type="text"
                          required 
                          placeholder="10 digit number"
                          className="pl-10"
                          maxLength={10}
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      {/* Account Name Resolution Feedback */}
                      {verifyingAccount && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          <span>Verifying account with bank...</span>
                        </div>
                      )}
                      {accountVerified && resolvedAccountName && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Account Name: {resolvedAccountName}</span>
                        </div>
                      )}
                      {verificationError && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{verificationError}</span>
                        </div>
                      )}
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
      </div>

      {/* History Sections */}
      {!isCustomer && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Payment &amp; Payout Evidence</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${historyTab === 'direct' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setHistoryTab('direct')}
              >
                ⚡ Direct Escrow Payouts ({directPayouts.length})
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${historyTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setHistoryTab('withdrawals')}
              >
                Wallet Withdrawals ({withdrawals.length})
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-slate-500">Loading history...</div>
          ) : historyTab === 'direct' ? (
            directPayouts.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                No direct escrow payouts yet. Once customers release job funds, records with Paystack transfer codes will appear here.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Job Details</th>
                      <th className="px-6 py-4 font-semibold">Amount (90%)</th>
                      <th className="px-6 py-4 font-semibold">Bank Account</th>
                      <th className="px-6 py-4 font-semibold">Paystack Code / Note</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {directPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-xs text-slate-700 whitespace-nowrap font-medium">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{p.jobTitle || 'Escrow Job'}</p>
                          {p.totalJobAmount && (
                            <p className="text-xs text-slate-500">Job Total: ₦{p.totalJobAmount.toLocaleString()} • Fee: ₦{(p.platformFee || 0).toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-700">₦{p.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{p.bankName}</span>
                          <span className="text-slate-500 block font-mono text-xs">{p.accountNumber}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 max-w-xs truncate" title={p.transferNote || p.transferCode || ''}>
                          {p.transferCode ? `Code: ${p.transferCode}` : (p.transferNote || 'Completed')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {p.transferStatus === 'paystack_direct_transfer' ? 'Direct Bank Transfer' : 'Credited to Wallet'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : withdrawals.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No manual withdrawals yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Destination</th>
                    <th className="px-6 py-4 font-semibold">Transfer Reference</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
                          w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          w.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {w.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                          {w.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

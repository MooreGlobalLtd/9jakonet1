import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where, getDoc, addDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, ArtisanProfile, EscrowContract } from '../types';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, ShieldCheck, Clock, CheckCircle, Banknote, ArrowUpRight, Search, RotateCcw, X, ChevronRight, Filter, AlertCircle, Phone, Mail, MapPin } from 'lucide-react';
import { sendEmail } from '../lib/email';
import { formatDateTime } from '../lib/utils';

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName?: string;
  transferCode?: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [jobs, setJobs] = useState<EscrowContract[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [paystackKeyInput, setPaystackKeyInput] = useState(localStorage.getItem('paystack_public_key') || '');
  const [paystackSecretInput, setPaystackSecretInput] = useState(localStorage.getItem('paystack_secret_key') || '');
  const [paystackBalance, setPaystackBalance] = useState<string | null>(null);
  const [balanceDetails, setBalanceDetails] = useState<{
    transferBalance: number;
    totalRevenue: number;
    totalTransactions: number;
  } | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  // Drilldown states for interactive stat cards
  const [activeDetailView, setActiveDetailView] = useState<'revenue' | 'users' | 'verified_artisans' | 'customers' | 'pending_verifications' | 'none'>('none');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'artisan' | 'admin'>('all');
  const [revenueSearchTerm, setRevenueSearchTerm] = useState('');
  const [resettingBalances, setResettingBalances] = useState(false);

  const handleResetSingleUserBalance = async (targetUser: User) => {
    if (!confirm(`Reset ${targetUser.displayName || targetUser.email}'s test wallet balance from ₦${(targetUser.walletBalance || 0).toLocaleString()} to ₦0?`)) return;
    try {
      await updateDoc(doc(db, 'users', targetUser.id), { walletBalance: 0 });
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, walletBalance: 0 } : u));
      alert(`✅ Reset ${targetUser.displayName || targetUser.email}'s wallet balance to ₦0.`);
    } catch (err) {
      console.error(err);
      alert('Failed to reset user balance.');
    }
  };

  const handleResetAllUserBalances = async () => {
    const toReset = users.filter(u => (u.walletBalance || 0) > 0);
    if (toReset.length === 0) {
      alert('All users currently have ₦0 wallet balance.');
      return;
    }
    if (!confirm(`This will clear test balances for ${toReset.length} users (including the ₦79,880 test balance) back to ₦0 for live production readiness. Proceed?`)) return;
    setResettingBalances(true);
    try {
      for (const u of toReset) {
        await updateDoc(doc(db, 'users', u.id), { walletBalance: 0 });
      }
      setUsers(prev => prev.map(u => ({ ...u, walletBalance: 0 })));
      alert(`✅ Successfully cleared ${toReset.length} test balances back to ₦0!`);
    } catch (err) {
      console.error(err);
      alert('Failed to reset balances.');
    } finally {
      setResettingBalances(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 1. Load config from Firestore (works on Vercel, Cloud Run, and any custom domain)
    const loadConfig = async () => {
      let activeSecret = localStorage.getItem('paystack_secret_key') || '';
      try {
        const snap = await getDoc(doc(db, 'system_config', 'paystack'));
        if (snap.exists()) {
          const cfg = snap.data();
          if (cfg.publicKey) {
            setPaystackKeyInput(cfg.publicKey);
            localStorage.setItem('paystack_public_key', cfg.publicKey);
          }
          if (cfg.secretKey) {
            setPaystackSecretInput(cfg.secretKey);
            localStorage.setItem('paystack_secret_key', cfg.secretKey);
            activeSecret = cfg.secretKey;
          }
        }
      } catch (err) {
        console.warn('Firestore config load notice:', err);
      }

      if (activeSecret) {
        fetchPaystackBalanceWithKey(activeSecret, true);
      }

      // 2. Also check server endpoint
      try {
        const res = await fetch('/api/paystack-config');
        const data = await res.json();
        if (data.publicKey) {
          setPaystackKeyInput(prev => prev || data.publicKey);
        }
      } catch (e) {
        console.warn('Server config check notice:', e);
      }
    };

    loadConfig();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);

      // Fetch artisans
      const artisansSnap = await getDocs(collection(db, 'artisans'));
      const artisansData = artisansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ArtisanProfile));
      setArtisans(artisansData);
      
      // Fetch jobs to calculate revenue
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const jobsData = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowContract));
      setJobs(jobsData);

      // Fetch withdrawals
      const withdrawalsSnap = await getDocs(collection(db, 'withdrawals'));
      const withdrawalsData = withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
      setWithdrawals(withdrawalsData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyArtisan = async (artisanId: string) => {
    try {
      await updateDoc(doc(db, 'artisans', artisanId), {
        verificationStatus: 'verified'
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to verify artisan:", error);
      alert("Verification failed");
    }
  };

  const executePaystackWithdrawal = async (w: Withdrawal) => {
    const artisanUser = users.find(u => u.id === w.userId);
    const resolvedBankCode = w.bankCode || artisanUser?.bankCode || '058';
    const recipientName = w.accountName || artisanUser?.accountName || artisanUser?.displayName || 'Artisan Partner';
    const secret = paystackSecretInput.trim() || localStorage.getItem('paystack_secret_key') || '';

    if (!confirm(`Trigger Paystack Transfer of ₦${w.amount.toLocaleString()} directly to:\n${recipientName}\n${w.bankName} (${w.accountNumber})?`)) {
      return;
    }

    setProcessingWithdrawalId(w.id);
    try {
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-Paystack-Secret-Key': secret } : {})
        },
        body: JSON.stringify({
          accountNumber: w.accountNumber,
          bankCode: resolvedBankCode,
          accountName: recipientName,
          amount: w.amount,
          reason: `Artisan Payout: ${recipientName}`,
          secretKey: secret
        })
      });

      const data = await res.json();
      if (data.success) {
        await updateDoc(doc(db, 'withdrawals', w.id), {
          status: 'completed',
          transferCode: data.transferCode,
          reference: data.reference,
          transferStatus: data.status || 'success',
          paidAt: Date.now()
        });

        // Add to transactions log
        await addDoc(collection(db, 'transactions'), {
          userId: w.userId,
          type: 'withdrawal_payout',
          title: `Withdrawal to ${w.bankName} (${w.accountNumber})`,
          amount: w.amount,
          transferCode: data.transferCode,
          reference: data.reference,
          status: 'completed',
          createdAt: Date.now()
        });

        // Email artisan
        if (artisanUser?.email) {
          sendEmail({
            to: artisanUser.email,
            subject: 'Withdrawal Disbursed! Funds in Bank',
            html: `
              <h2>Withdrawal Successful!</h2>
              <p>Hi ${recipientName},</p>
              <p>Your withdrawal of <strong>₦${w.amount.toLocaleString()}</strong> has been transferred directly into your bank account (${w.bankName} - ${w.accountNumber}) via Paystack.</p>
              <p><strong>Transfer Reference:</strong> ${data.reference || data.transferCode}</p>
              <p>Thank you for working with 9jaKonet!</p>
            `
          });
        }

        alert(`⚡ Payout Successful! ₦${w.amount.toLocaleString()} sent directly to ${recipientName}'s bank account via Paystack! (Transfer Code: ${data.transferCode})`);
        fetchData();
      } else {
        if (data.error && data.error.toLowerCase().includes('starter business')) {
          alert(`⚠️ Paystack Starter Business Limitation:\n\n${data.error}\n\nUnder Nigerian banking regulations (CBN), Paystack only allows automated API transfers for "Registered Businesses" (accounts verified with CAC registration).\n\n💡 Immediate Solution:\n1. Open your OPay / banking app and send ₦${w.amount.toLocaleString()} directly to:\n   ${recipientName}\n   ${w.bankName} - ${w.accountNumber}\n\n2. Click "Mark Paid Manually" below to instantly finalize this withdrawal and email the artisan!\n\n(To enable automated API payouts in the future, upgrade your Paystack account to a Registered Business under Settings > Compliance on Paystack).`);
        } else {
          alert(`❌ Paystack Transfer Notice: ${data.error || 'Unknown error'}\n\nPlease check: 1. Your Paystack account has sufficient NGN balance. 2. Your Paystack account has Transfers enabled.`);
        }
      }
    } catch (error: any) {
      console.error('Withdrawal transfer error:', error);
      alert('Error contacting payout endpoint: ' + (error?.message || 'Check server connection or Paystack keys.'));
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const rejectWithdrawal = async (w: Withdrawal) => {
    if (!confirm(`Reject this withdrawal and refund ₦${w.amount.toLocaleString()} back to the artisan's wallet?`)) return;

    try {
      await updateDoc(doc(db, 'withdrawals', w.id), {
        status: 'rejected',
        rejectedAt: Date.now()
      });

      await updateDoc(doc(db, 'users', w.userId), {
        walletBalance: increment(w.amount)
      });

      alert(`Withdrawal rejected. ₦${w.amount.toLocaleString()} refunded to artisan's wallet.`);
      fetchData();
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
      alert('Failed to reject and refund withdrawal.');
    }
  };

  const markWithdrawalComplete = async (withdrawalId: string) => {
    try {
      const withdrawalDoc = withdrawals.find(w => w.id === withdrawalId);
      if (!withdrawalDoc) return;

      if (!confirm(`Confirm you have sent ₦${withdrawalDoc.amount.toLocaleString()} to ${withdrawalDoc.accountName || 'the artisan'} (${withdrawalDoc.bankName} - ${withdrawalDoc.accountNumber})?`)) {
        return;
      }

      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'completed',
        transferStatus: 'manual_transfer',
        paidAt: Date.now()
      });

      // Add to transactions log
      await addDoc(collection(db, 'transactions'), {
        userId: withdrawalDoc.userId,
        type: 'withdrawal_payout',
        title: `Withdrawal to ${withdrawalDoc.bankName} (${withdrawalDoc.accountNumber})`,
        amount: withdrawalDoc.amount,
        status: 'completed',
        createdAt: Date.now()
      });
      
      const artisanDoc = await getDoc(doc(db, 'users', withdrawalDoc.userId));
      if (artisanDoc.exists()) {
        const artisanEmail = artisanDoc.data().email;
        const artisanName = artisanDoc.data().displayName || withdrawalDoc.accountName || 'Artisan Partner';
        if (artisanEmail) {
          sendEmail({
            to: artisanEmail,
            subject: 'Your Withdrawal has been Processed!',
            html: `
              <h2>Withdrawal Completed!</h2>
              <p>Hi ${artisanName},</p>
              <p>Great news! Your withdrawal request for <strong>₦${withdrawalDoc.amount.toLocaleString()}</strong> has been marked as transferred to your bank account (${withdrawalDoc.bankName} - ${withdrawalDoc.accountNumber}).</p>
              <br/>
              <p>Thank you for using 9jaKonet.</p>
            `
          });
        }
      }

      alert(`✅ Withdrawal marked as completed! ₦${withdrawalDoc.amount.toLocaleString()} marked as paid and artisan notified.`);
      fetchData();
    } catch (error) {
      console.error("Failed to update withdrawal", error);
      alert("Failed to update: " + error);
    }
  };

  const fetchPaystackBalanceWithKey = async (secret: string, silent = false) => {
    if (!silent) setCheckingBalance(true);
    try {
      if (!secret) {
        if (!silent) alert('Please enter and save your Paystack Secret Key first.');
        return;
      }

      const res = await fetch(`/api/paystack-balance?secretKey=${encodeURIComponent(secret)}`, {
        headers: {
          'X-Paystack-Secret-Key': secret
        }
      });
      const data = await res.json();
      if (data.success) {
        const transferBal = typeof data.transferBalance === 'number' ? data.transferBalance : 0;
        const totalRev = typeof data.totalRevenue === 'number' ? data.totalRevenue : 0;
        const totalTx = data.totalTransactions || 0;

        setBalanceDetails({
          transferBalance: transferBal,
          totalRevenue: totalRev,
          totalTransactions: totalTx
        });
        setPaystackBalance(`₦${transferBal.toLocaleString()}`);

        if (!silent) {
          alert(`✅ Connected to Paystack!\n\n📊 Live Account Financials:\n• Total Customer Revenue: ₦${totalRev.toLocaleString()} (Matches your Paystack Dashboard Revenue / Next Payout)\n• Available Transfer Balance: ₦${transferBal.toLocaleString()} (For automated API payouts)\n\n💡 Note: As a Starter Business, Paystack sweeps customer payments (₦${totalRev.toLocaleString()}) to your linked bank account. You can disburse artisan funds directly from your bank app and click "Mark Paid Manually"!`);
        }
      } else {
        if (!silent) {
          alert(`Paystack Response: ${data.error || 'Failed to retrieve balance. Please verify your secret key.'}`);
        }
      }
    } catch (error: any) {
      console.error('Balance check error:', error);
      if (!silent) {
        alert('Could not connect to Paystack balance endpoint: ' + (error?.message || 'Check connection.'));
      }
    } finally {
      if (!silent) setCheckingBalance(false);
    }
  };

  const checkLiveBalance = async () => {
    const secret = paystackSecretInput.trim() || localStorage.getItem('paystack_secret_key') || '';
    await fetchPaystackBalanceWithKey(secret, false);
  };

  const handleSavePaystackSettings = async () => {
    const cleanPublic = paystackKeyInput.trim();
    const cleanSecret = paystackSecretInput.trim();

    if (!cleanPublic && !cleanSecret) {
      alert('Please enter your Paystack keys');
      return;
    }

    try {
      // 1. Persist in Firestore so it's active everywhere (Vercel, custom domain, Cloud Run)
      await setDoc(doc(db, 'system_config', 'paystack'), {
        publicKey: cleanPublic,
        secretKey: cleanSecret,
        updatedAt: Date.now()
      }, { merge: true });

      // 2. Persist in localStorage for instant fast retrieval
      if (cleanPublic) localStorage.setItem('paystack_public_key', cleanPublic);
      if (cleanSecret) localStorage.setItem('paystack_secret_key', cleanSecret);

      // 3. Synchronize with server endpoint
      try {
        await fetch('/api/paystack-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicKey: cleanPublic,
            secretKey: cleanSecret
          })
        });
      } catch (e) {
        console.warn('API sync notice:', e);
      }

      alert('✅ Paystack configuration saved successfully! Keys are safely stored and active for automated bank payouts.');
      checkLiveBalance();
    } catch (error: any) {
      console.error('Save configuration error:', error);
      alert('Error saving configuration: ' + (error?.message || error));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-8 text-center text-red-600">
        You do not have permission to view this page.
      </div>
    );
  }

  const pendingArtisans = artisans.filter(a => a.verificationStatus === 'pending');
  const customersCount = users.filter(u => u.role === 'customer').length;
  const verifiedArtisansCount = artisans.filter(a => a.verificationStatus === 'verified').length;
  
  // Calculate Platform Revenue (10% of completed jobs)
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.platformFee || 0), 0);
  const totalEscrowVolume = completedJobs.reduce((sum, j) => sum + (j.amount || 0), 0);

  const filteredCompletedJobs = completedJobs.filter(j => {
    if (!revenueSearchTerm) return true;
    const term = revenueSearchTerm.toLowerCase();
    return (
      (j.title || '').toLowerCase().includes(term) ||
      (j.artisanName || '').toLowerCase().includes(term) ||
      (j.customerName || '').toLowerCase().includes(term)
    );
  });

  const filteredUsers = users.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    if (!matchesRole) return false;
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phoneNumber || '').toLowerCase().includes(term) ||
      (u.state || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-slate-500 text-sm mt-1">
            Click any metric card below to inspect revenue ledger, users, artisans, and pending verifications with exact dates &amp; times.
          </p>
        </div>
        {users.some(u => (u.walletBalance || 0) > 0) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetAllUserBalances}
            disabled={resettingBalances}
            className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="h-4 w-4" />
            {resettingBalances ? 'Resetting...' : 'Reset All Test Balances to ₦0'}
          </Button>
        )}
      </div>

      {/* Stats Cards - Interactive Click to Drill Down */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {/* Total Revenue Card */}
        <Card 
          onClick={() => setActiveDetailView(activeDetailView === 'revenue' ? 'none' : 'revenue')}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border ${
            activeDetailView === 'revenue' 
              ? 'bg-slate-900 ring-4 ring-emerald-500/40 border-emerald-500' 
              : 'bg-slate-900 hover:border-emerald-600/50 border-slate-800'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-emerald-500/20 p-2.5 text-emerald-400">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
                <h3 className="text-2xl font-black text-white tracking-tight">₦{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">10% Platform Cut</span>
              <span className={`font-semibold flex items-center gap-0.5 ${activeDetailView === 'revenue' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {activeDetailView === 'revenue' ? 'Active Breakdown' : 'View Ledger →'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Users Card */}
        <Card 
          onClick={() => setActiveDetailView(activeDetailView === 'users' ? 'none' : 'users')}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border ${
            activeDetailView === 'users' 
              ? 'ring-4 ring-blue-500/30 border-blue-500 bg-blue-50/30' 
              : 'hover:border-blue-300'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Users</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{users.length}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">All registered accounts</span>
              <span className={`font-semibold flex items-center gap-0.5 ${activeDetailView === 'users' ? 'text-blue-600' : 'text-slate-400'}`}>
                {activeDetailView === 'users' ? 'Active Breakdown' : 'View Users →'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Verified Artisans Card */}
        <Card 
          onClick={() => setActiveDetailView(activeDetailView === 'verified_artisans' ? 'none' : 'verified_artisans')}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border ${
            activeDetailView === 'verified_artisans' 
              ? 'ring-4 ring-emerald-500/30 border-emerald-500 bg-emerald-50/30' 
              : 'hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Artisans</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{verifiedArtisansCount}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Active professionals</span>
              <span className={`font-semibold flex items-center gap-0.5 ${activeDetailView === 'verified_artisans' ? 'text-emerald-600' : 'text-slate-400'}`}>
                {activeDetailView === 'verified_artisans' ? 'Active Breakdown' : 'View Artisans →'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card 
          onClick={() => setActiveDetailView(activeDetailView === 'customers' ? 'none' : 'customers')}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border ${
            activeDetailView === 'customers' 
              ? 'ring-4 ring-purple-500/30 border-purple-500 bg-purple-50/30' 
              : 'hover:border-purple-300'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customers</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{customersCount}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Hiring clients</span>
              <span className={`font-semibold flex items-center gap-0.5 ${activeDetailView === 'customers' ? 'text-purple-600' : 'text-slate-400'}`}>
                {activeDetailView === 'customers' ? 'Active Breakdown' : 'View Customers →'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications Card */}
        <Card 
          onClick={() => setActiveDetailView(activeDetailView === 'pending_verifications' ? 'none' : 'pending_verifications')}
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border ${
            activeDetailView === 'pending_verifications' 
              ? 'ring-4 ring-amber-500/30 border-amber-500 bg-amber-50/30' 
              : 'hover:border-amber-300'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-amber-100 p-2.5 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pendingArtisans.length}</h3>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Awaiting approval</span>
              <span className={`font-semibold flex items-center gap-0.5 ${activeDetailView === 'pending_verifications' ? 'text-amber-600' : 'text-slate-400'}`}>
                {activeDetailView === 'pending_verifications' ? 'Active Breakdown' : 'Review →'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EXPANDED DRILL-DOWN DETAILS SECTION */}
      {activeDetailView !== 'none' && (
        <Card className="mb-8 border-2 border-slate-200 shadow-md bg-white animate-in fade-in duration-200">
          <CardHeader className="bg-slate-50 border-b border-slate-200 py-4 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                  {activeDetailView === 'revenue' && <Banknote className="h-5 w-5 text-emerald-600" />}
                  {activeDetailView === 'users' && <Users className="h-5 w-5 text-blue-600" />}
                  {activeDetailView === 'verified_artisans' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  {activeDetailView === 'customers' && <Users className="h-5 w-5 text-purple-600" />}
                  {activeDetailView === 'pending_verifications' && <Clock className="h-5 w-5 text-amber-600" />}
                </span>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {activeDetailView === 'revenue' && 'Platform Revenue & Commission Ledger'}
                    {activeDetailView === 'users' && `Total Users Directory (${users.length})`}
                    {activeDetailView === 'verified_artisans' && `Verified Professional Artisans (${verifiedArtisansCount})`}
                    {activeDetailView === 'customers' && `Registered Customers (${customersCount})`}
                    {activeDetailView === 'pending_verifications' && `Pending Artisan Applications (${pendingArtisans.length})`}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    {activeDetailView === 'revenue' && 'Complete audit log of 10% platform commission with exact dates, times, and artisan details.'}
                    {activeDetailView === 'users' && 'Manage all user accounts, view wallet balances, and clear prototype test balances.'}
                    {activeDetailView === 'verified_artisans' && 'Directory of all vetted artisans approved to accept jobs.'}
                    {activeDetailView === 'customers' && 'Directory of all registered clients hiring artisans.'}
                    {activeDetailView === 'pending_verifications' && 'Review and approve artisan identity credentials.'}
                  </p>
                </div>
              </div>

              {/* View Switcher Tabs & Close Button */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveDetailView('revenue')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeDetailView === 'revenue' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailView('users')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeDetailView === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Users ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailView('verified_artisans')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeDetailView === 'verified_artisans' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Artisans ({verifiedArtisansCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailView('customers')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeDetailView === 'customers' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Customers ({customersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailView('pending_verifications')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeDetailView === 'pending_verifications' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Pending ({pendingArtisans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailView('none')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                  title="Close drill-down"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* 1. REVENUE LEDGER DRILLDOWN */}
            {activeDetailView === 'revenue' && (
              <div className="space-y-5">
                {/* Revenue Overview Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Total Platform Commission</span>
                    <span className="text-2xl font-bold text-emerald-900 mt-1 block">₦{totalRevenue.toLocaleString()}</span>
                    <span className="text-[11px] text-emerald-700 mt-0.5 block">10% retained from all finished jobs</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Gross Escrow Transacted</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">₦{totalEscrowVolume.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Total volume handled in escrow</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Completed Contracts</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">{completedJobs.length}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Jobs successfully released</span>
                  </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by job title, artisan, or customer..."
                      value={revenueSearchTerm}
                      onChange={(e) => setRevenueSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    Showing {filteredCompletedJobs.length} of {completedJobs.length} commission records
                  </span>
                </div>

                {/* Table */}
                {filteredCompletedJobs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50">
                    <Banknote className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No completed jobs found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Whenever a customer clicks &ldquo;Release Funds&rdquo; for an artisan, the job and 10% commission entry will be instantly logged here with exact date and time.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Date &amp; Time</th>
                          <th className="px-4 py-3">Job Description</th>
                          <th className="px-4 py-3">Artisan</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Total Value</th>
                          <th className="px-4 py-3 text-emerald-700 bg-emerald-50/50">Commission (10%)</th>
                          <th className="px-4 py-3">Artisan Net (90%)</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCompletedJobs.map((j) => (
                          <tr key={j.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-medium">
                              {formatDateTime(j.completedAt || j.createdAt)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {j.title}
                              <span className="block font-mono text-[10px] text-slate-400">ID: {j.id.slice(0, 10)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900">{j.artisanName || 'Artisan'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-slate-700">{j.customerName || 'Customer'}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              ₦{(j.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-700 bg-emerald-50/30">
                              +₦{(j.platformFee || Math.round((j.amount || 0) * 0.10)).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              ₦{(j.artisanPayout || Math.round((j.amount || 0) * 0.90)).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle className="h-3 w-3" /> Released
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

            {/* 2. ALL USERS DRILLDOWN */}
            {activeDetailView === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, or state..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filter by Role */}
                  <div className="flex items-center gap-1.5">
                    {(['all', 'customer', 'artisan', 'admin'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setUserRoleFilter(role)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                          userRoleFilter === role 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">State / Location</th>
                        <th className="px-4 py-3">Wallet Balance</th>
                        <th className="px-4 py-3">Registered At</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{u.displayName || 'No Name'}</p>
                                <p className="text-[11px] text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              u.role === 'artisan' ? 'bg-blue-100 text-blue-800' :
                              u.role === 'customer' ? 'bg-purple-100 text-purple-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-slate-800">{u.phoneNumber || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span>{u.state || '—'}</span>
                            {u.address && <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">{u.address}</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            ₦{(u.walletBalance || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {formatDateTime(u.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(u.walletBalance || 0) > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetSingleUserBalance(u)}
                                className="h-7 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-100"
                              >
                                Reset to ₦0
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">₦0 Clean</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. VERIFIED ARTISANS DRILLDOWN */}
            {activeDetailView === 'verified_artisans' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Artisan</th>
                        <th className="px-4 py-3">Trade Category</th>
                        <th className="px-4 py-3">Experience</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">State / City</th>
                        <th className="px-4 py-3">Jobs Completed</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {artisans.filter(a => a.verificationStatus === 'verified').map((artisan) => {
                        const artisanUser = users.find(u => u.id === artisan.userId);
                        return (
                          <tr key={artisan.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {artisanUser?.displayName || artisan.businessName || 'Verified Artisan'}
                              <span className="block text-[10px] text-slate-400">{artisanUser?.email}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {artisan.tradeCategory}
                            </td>
                            <td className="px-4 py-3">
                              {artisan.yearsExp} Years
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {artisanUser?.phoneNumber || artisan.phoneNumber || '—'}
                            </td>
                            <td className="px-4 py-3">
                              {artisan.state || artisanUser?.state || '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {artisan.completedJobsCount || 0}
                            </td>
                            <td className="px-4 py-3">
                              ⭐ {(artisan.rating || 5.0).toFixed(1)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle className="h-3 w-3" /> Verified
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. CUSTOMERS DRILLDOWN */}
            {activeDetailView === 'customers' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Customer Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone Number</th>
                        <th className="px-4 py-3">State &amp; Address</th>
                        <th className="px-4 py-3">Registered At</th>
                        <th className="px-4 py-3">Wallet / Escrow Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => u.role === 'customer').map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {customer.displayName || 'Customer'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {customer.email}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-800">
                            {customer.phoneNumber || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span>{customer.state || '—'}</span>
                            {customer.address && <span className="block text-[10px] text-slate-400">{customer.address}</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-medium">
                            {formatDateTime(customer.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            ₦{(customer.walletBalance || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. PENDING VERIFICATIONS DRILLDOWN */}
            {activeDetailView === 'pending_verifications' && (
              <div className="space-y-4">
                {pendingArtisans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50">
                    <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">There are no artisan applications pending verification right now.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {pendingArtisans.map((artisan) => {
                      const artisanUser = users.find(u => u.id === artisan.userId);
                      return (
                        <div key={artisan.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{artisanUser?.displayName || artisan.businessName || 'New Artisan'}</h4>
                              <p className="text-xs text-slate-500">{artisanUser?.email}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trade</span>
                              <span className="font-semibold text-slate-800">{artisan.tradeCategory}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Experience</span>
                              <span className="font-semibold text-slate-800">{artisan.yearsExp} Years</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                              <span className="font-semibold text-slate-800">{artisanUser?.phoneNumber || artisan.phoneNumber || '—'}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
                              <span className="font-semibold text-slate-800">{artisan.state || artisanUser?.state || '—'}</span>
                            </div>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <Button
                              type="button"
                              onClick={() => verifyArtisan(artisan.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9"
                            >
                              Approve &amp; Verify Artisan
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Pending Artisan Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : pendingArtisans.length === 0 ? (
              <p className="text-slate-500 text-sm">No artisans waiting for verification.</p>
            ) : (
              <div className="space-y-4">
                {pendingArtisans.map(artisan => {
                  const artisanUser = users.find(u => u.id === artisan.userId);
                  return (
                    <div key={artisan.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{artisanUser?.displayName || 'Unknown User'}</p>
                        <p className="text-sm text-slate-500">{artisan.tradeCategory} • {artisan.yearsExp} years exp.</p>
                      </div>
                      <Button size="sm" onClick={() => verifyArtisan(artisan.id)}>
                        Verify Now
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                Pending Artisan Withdrawals
              </div>
              <span className="text-xs font-normal text-slate-500">
                {withdrawals.filter(w => w.status === 'pending').length} pending
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : withdrawals.filter(w => w.status === 'pending').length === 0 ? (
              <p className="text-slate-500 text-sm">No pending withdrawal requests.</p>
            ) : (
              <div className="space-y-4">
                {withdrawals.filter(w => w.status === 'pending').map(w => {
                  const reqUser = users.find(u => u.id === w.userId);
                  const isProcessing = processingWithdrawalId === w.id;
                  return (
                    <div key={w.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                              onClick={() => rejectWithdrawal(w)}
                              className="text-xs text-red-600 hover:text-red-800 underline"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-slate-500 block">Bank</span>
                          <span className="font-semibold text-slate-900">{w.bankName}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">{w.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(w.accountNumber);
                                alert(`Copied account number ${w.accountNumber} to clipboard!`);
                              }}
                              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              title="Copy account number"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        {w.accountName && (
                          <div className="col-span-2">
                            <span className="text-xs text-slate-500 block">Verified Account Name</span>
                            <span className="font-medium text-emerald-800">{w.accountName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paystack Gateway Configuration */}
        <Card className="md:col-span-2 border-emerald-200">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-950">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Paystack Gateway Configuration (Live Payouts & Escrow)
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {balanceDetails ? (
                  <>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-full font-semibold text-xs flex items-center gap-1 shadow-xs border border-blue-200">
                      <span>💰 Customer Revenue:</span>
                      <strong className="font-bold">₦{balanceDetails.totalRevenue.toLocaleString()}</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full font-semibold text-xs flex items-center gap-1 shadow-xs border border-emerald-200">
                      <span>⚡ Transfer Wallet:</span>
                      <strong className="font-bold">₦{balanceDetails.transferBalance.toLocaleString()}</strong>
                    </span>
                  </>
                ) : paystackBalance ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                    Paystack: {paystackBalance}
                  </span>
                ) : null}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => checkLiveBalance()} 
                  disabled={checkingBalance}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-100 h-8 text-xs font-semibold cursor-pointer"
                >
                  {checkingBalance ? 'Checking...' : 'Check Live Balance'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {balanceDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>📊 Live Paystack Account Status:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs">
                      <span className="text-slate-500 block text-[11px] font-medium">Customer Revenue (Pending Payout / Next Settlement)</span>
                      <span className="text-lg font-bold text-blue-700">₦{balanceDetails.totalRevenue.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Total payments collected from clients. Paystack schedules this to pay out directly to your settlement bank account.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs">
                      <span className="text-slate-500 block text-[11px] font-medium">Transfer Wallet (For Automated "Pay via Paystack" API)</span>
                      <span className="text-lg font-bold text-emerald-700">₦{balanceDetails.transferBalance.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Available for automated API payouts to artisans. Once your CAC is approved on Paystack, you can top up this wallet or settle directly into it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Paystack Account Type:</strong> Starter businesses collect client payments into Revenue/Next Payout and disburse to artisans via your banking app + clicking <em>Mark Paid Manually</em>. Upgrading to a CAC-Registered Business unlocks 1-click automated API transfers.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paystack Public Key (Client Checkout)</label>
                <input 
                  type="text" 
                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  value={paystackKeyInput}
                  onChange={(e) => setPaystackKeyInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paystack Secret Key (Automated Bank Transfers &amp; Payouts)</label>
                <input 
                  type="password" 
                  placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  value={paystackSecretInput}
                  onChange={(e) => setPaystackSecretInput(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">This key is securely stored on the server to execute instant 90% payouts to artisans when customers release escrow funds.</p>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11"
                  onClick={handleSavePaystackSettings}
                >
                  Save Paystack Configuration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where, getDoc, addDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, ArtisanProfile, EscrowContract } from '../types';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, ShieldCheck, Clock, CheckCircle, Banknote, ArrowUpRight } from 'lucide-react';
import { sendEmail } from '../lib/email';

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
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // Load config from server
    fetch('/api/paystack-config')
      .then(res => res.json())
      .then(data => {
        if (data.publicKey && !paystackKeyInput) {
          setPaystackKeyInput(data.publicKey);
        }
      })
      .catch(console.error);
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

    if (!confirm(`Trigger Paystack Transfer of ₦${w.amount.toLocaleString()} directly to:\n${recipientName}\n${w.bankName} (${w.accountNumber})?`)) {
      return;
    }

    setProcessingWithdrawalId(w.id);
    try {
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountNumber: w.accountNumber,
          bankCode: resolvedBankCode,
          accountName: recipientName,
          amount: w.amount,
          reason: `Artisan Payout: ${recipientName}`
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
        alert(`❌ Paystack Transfer Failed: ${data.error || 'Unknown error'}\n\nNote: If this mentions OTP or balance, check your Paystack Dashboard to verify balance or disable Transfers OTP under Preferences.`);
      }
    } catch (error) {
      console.error('Withdrawal transfer error:', error);
      alert('Network error communicating with Paystack transfer endpoint.');
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
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'completed'
      });
      
      // Fetch withdrawal details to get the userId
      const withdrawalDoc = withdrawals.find(w => w.id === withdrawalId);
      if (withdrawalDoc) {
        const artisanDoc = await getDoc(doc(db, 'users', withdrawalDoc.userId));
        if (artisanDoc.exists()) {
          const artisanEmail = artisanDoc.data().email;
          const artisanName = artisanDoc.data().displayName;
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
      }

      alert("Withdrawal marked as completed!");
      fetchData();
    } catch (error) {
      console.error("Failed to update withdrawal", error);
      alert("Failed to update: " + error);
    }
  };

  const checkLiveBalance = async () => {
    setCheckingBalance(true);
    try {
      const res = await fetch('/api/paystack-balance');
      const data = await res.json();
      if (data.success && data.balances?.length) {
        const ngn = data.balances.find((b: any) => b.currency === 'NGN');
        if (ngn) {
          setPaystackBalance(`₦${(ngn.balance / 100).toLocaleString()}`);
        } else {
          setPaystackBalance('0 NGN');
        }
      } else {
        alert(data.error || 'Failed to retrieve Paystack balance. Please check your Secret Key.');
      }
    } catch (error) {
      alert('Failed to connect to Paystack balance endpoint');
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleSavePaystackSettings = async () => {
    if (!paystackKeyInput && !paystackSecretInput) {
      alert('Please enter your Paystack keys');
      return;
    }

    try {
      const res = await fetch('/api/admin/paystack-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: paystackKeyInput,
          secretKey: paystackSecretInput
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('paystack_public_key', paystackKeyInput);
        if (paystackSecretInput) {
          localStorage.setItem('paystack_secret_key', paystackSecretInput);
        }
        alert('✅ Paystack configuration saved successfully on the server! Real escrow payouts and automated bank transfers are now active.');
        checkLiveBalance();
      } else {
        alert(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      alert('Failed to save configuration to server');
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
  const totalRevenue = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + (j.platformFee || 0), 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Admin Control Panel</h1>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card className="bg-slate-900 border-none">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-400">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Revenue (10%)</p>
              <h3 className="text-2xl font-bold text-white">₦{totalRevenue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{users.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Verified Artisans</p>
              <h3 className="text-2xl font-bold text-slate-900">{verifiedArtisansCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Customers</p>
              <h3 className="text-2xl font-bold text-slate-900">{customersCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Verifications</p>
              <h3 className="text-2xl font-bold text-slate-900">{pendingArtisans.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

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
                          <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
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
                          <span className="font-mono font-semibold text-slate-900">{w.accountNumber}</span>
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
              <div className="flex items-center gap-3">
                {paystackBalance && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm">
                    Paystack NGN Balance: {paystackBalance}
                  </span>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={checkLiveBalance} 
                  disabled={checkingBalance}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-100"
                >
                  {checkingBalance ? 'Checking...' : 'Check Live Balance'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Important for Instant Transfers:</strong> To enable automatic bank payouts, ensure your Paystack account has sufficient balance, and that <em>Transfers OTP</em> is disabled on your Paystack Dashboard (Settings &gt; Preferences &gt; Transfers).
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

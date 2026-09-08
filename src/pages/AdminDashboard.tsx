import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where, getDoc } from 'firebase/firestore';
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
  accountNumber: string;
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

  useEffect(() => {
    fetchData();
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
                <p>Great news! Your withdrawal request for <strong>₦${withdrawalDoc.amount.toLocaleString()}</strong> has been successfully processed and transferred to your bank account (${withdrawalDoc.bankName} - ${withdrawalDoc.accountNumber}).</p>
                <p>Please allow up to 24 hours for the funds to reflect in your account.</p>
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

        {/* All Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              Pending Withdrawals
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
                  return (
                    <div key={w.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-lg">₦{w.amount.toLocaleString()}</p>
                          <p className="font-medium text-slate-700">{reqUser?.displayName || 'Unknown User'}</p>
                        </div>
                        <Button size="sm" type="button" className="bg-emerald-600 hover:bg-emerald-700 z-10 relative cursor-pointer" onClick={(e) => {
                          e.preventDefault();
                          markWithdrawalComplete(w.id);
                        }}>
                          Mark Paid
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm">
                        <p><span className="text-slate-500">Bank:</span> <span className="font-semibold text-slate-900">{w.bankName}</span></p>
                        <p><span className="text-slate-500">Account:</span> <span className="font-mono font-semibold text-slate-900">{w.accountNumber}</span></p>
                        <p className="text-xs text-amber-600 mt-2">Transfer this exactly via Paystack Dashboard first!</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paystack Key Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-emerald-600" />
              Paystack Gateway Configuration (Live / Test)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Enter your Paystack Public Key (e.g. <code>pk_live_...</code> or <code>pk_test_...</code>) here to power secure customer escrow funding. This key is saved securely in your browser and used instantly when customers click Fund Escrow.
              </p>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="e.g. pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={paystackKeyInput}
                  onChange={(e) => setPaystackKeyInput(e.target.value)}
                />
                <Button onClick={() => {
                  localStorage.setItem('paystack_public_key', paystackKeyInput);
                  alert('Paystack Public Key saved successfully!');
                }}>
                  Save Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

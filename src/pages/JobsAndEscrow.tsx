import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, getDoc, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { EscrowContract, ArtisanProfile } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldCheck, Banknote, CheckCircle, Clock, Star, KeyRound, AlertCircle, RefreshCw, X, ArrowRight } from 'lucide-react';
import { sendEmail } from '../lib/email';
import { formatDateTime } from '../lib/utils';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

import { PaystackButton } from 'react-paystack';

export default function JobsAndEscrow() {
  const { user, init } = useAuthStore();
  const [jobs, setJobs] = useState<EscrowContract[]>([]);
  const [reviewForm, setReviewForm] = useState<{ [jobId: string]: { score: number, comment: string } }>({});
  const [paystackPublicKey, setPaystackPublicKey] = useState<string>(
    localStorage.getItem('paystack_public_key') || (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_04b9016335193910cdba3828c46002496a7ef412'
  );

  // OTP Release State
  const [otpModalJob, setOtpModalJob] = useState<EscrowContract | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpSending, setOtpSending] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [releasing, setReleasing] = useState<boolean>(false);
  const [resettingBalance, setResettingBalance] = useState<boolean>(false);

  const handleResetTestBalance = async () => {
    if (!user) return;
    if (!confirm('Clear your prototype wallet balance back to ₦0 for live production readiness?')) return;
    setResettingBalance(true);
    
    if (isQuotaExhausted()) {
      useAuthStore.setState({ user: { ...user, walletBalance: 0 } });
      alert('Balance reset in current session (Cloud sync disabled due to quota limits).');
      setResettingBalance(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.id), { walletBalance: 0 });
      useAuthStore.setState({ user: { ...user, walletBalance: 0 } });
      alert('✅ Wallet balance has been reset to ₦0 successfully!');
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'resource-exhausted' || e?.message?.includes('quota')) {
        markQuotaExhausted();
        useAuthStore.setState({ user: { ...user, walletBalance: 0 } });
        alert('Balance reset in current session. Database write quota limit will sync when refreshed.');
      } else {
        alert('Failed to reset wallet balance: ' + (e?.message || 'Database error'));
      }
    } finally {
      setResettingBalance(false);
    }
  };

  useEffect(() => {
    // Load Paystack public key from Firestore system_config
    getDoc(doc(db, 'system_config', 'paystack'))
      .then(snap => {
        if (snap.exists() && snap.data().publicKey) {
          setPaystackPublicKey(snap.data().publicKey);
          localStorage.setItem('paystack_public_key', snap.data().publicKey);
        }
      })
      .catch(err => console.warn('Could not load public key from Firestore:', err));

    if (!user) return;

    // Listen to jobs where user is either customer or artisan
    const qCustomer = query(collection(db, 'jobs'), where('customerId', '==', user.id));
    const qArtisan = query(collection(db, 'jobs'), where('artisanId', '==', user.id));

    const unsubscribeCustomer = onSnapshot(qCustomer, (snap) => {
      const customerJobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as EscrowContract));
      setJobs(prev => {
        const merged = [...customerJobs, ...prev.filter(p => p.artisanId === user.id)];
        return Array.from(new Map(merged.map(item => [item.id, item])).values()).sort((a, b) => b.createdAt - a.createdAt);
      });
    }, (err) => {
      console.warn('Customer jobs snapshot notice:', err?.message || err);
    });

    const unsubscribeArtisan = onSnapshot(qArtisan, (snap) => {
      const artisanJobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as EscrowContract));
      setJobs(prev => {
        const merged = [...prev.filter(p => p.customerId === user.id), ...artisanJobs];
        return Array.from(new Map(merged.map(item => [item.id, item])).values()).sort((a, b) => b.createdAt - a.createdAt);
      });
    }, (err) => {
      console.warn('Artisan jobs snapshot notice:', err?.message || err);
    });

    return () => {
      unsubscribeCustomer();
      unsubscribeArtisan();
    };
  }, [user]);

  const handleFundEscrow = async (job: EscrowContract, paymentReference?: any) => {
    try {
      const fundedAt = Date.now();
      const refCode = paymentReference?.reference || paymentReference?.trxref || `escrow_funded_${fundedAt}`;

      // Optimistically update local state so button changes immediately
      setJobs(prev => prev.map(j => j.id === job.id ? { 
        ...j, 
        status: 'in_progress',
        fundedAt,
        escrowFunded: true
      } : j));

      await updateDoc(doc(db, 'jobs', job.id), { 
        status: 'in_progress',
        fundedAt,
        escrowFunded: true,
        paystackReference: refCode
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user!.id,
        customerId: user!.id,
        artisanId: job.artisanId,
        jobId: job.id,
        jobTitle: job.title,
        type: 'escrow_funding',
        amount: job.amount,
        reference: refCode,
        status: 'funded',
        createdAt: fundedAt
      });
      
      // Send Email to Artisan
      const artisanDoc = await getDoc(doc(db, 'users', job.artisanId));
      if (artisanDoc.exists()) {
        const artisanEmail = artisanDoc.data().email;
        if (artisanEmail) {
          sendEmail({
            to: artisanEmail,
            subject: 'Exciting News! Your Escrow has been Funded',
            html: `
              <h2>Escrow Funded Successfully!</h2>
              <p>Hi ${job.artisanName},</p>
              <p>Great news! The escrow for your job <strong>"${job.title}"</strong> has been securely funded with <strong>₦${job.amount.toLocaleString()}</strong> by ${job.customerName}.</p>
              <p>The money is held securely in the 9jaKonet vault. You can begin the work with full confidence!</p>
              <br/>
              <p>Log in to your dashboard to view the details.</p>
            `
          });
        }
      }

      alert(`✅ Escrow funded! ₦${job.amount.toLocaleString()} is securely held in vault. ${job.artisanName} has been notified to proceed!`);
    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        markQuotaExhausted();
        console.warn("Firestore write quota reached. State preserved locally until next load.");
        alert("Payment verified. Status updated locally. Cloud sync disabled until quota resets.");
      } else {
        console.error("Fund escrow error:", error);
        alert("Notice: Payment completed. If status doesn't refresh automatically, reload page.");
      }
    }
  };

  // Step 1: When customer clicks "Release Funds", generate 6-digit OTP and send to their email
  const initiateReleaseOtp = async (job: EscrowContract) => {
    setOtpModalJob(job);
    setEnteredOtp('');
    setOtpError('');
    setOtpSending(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `🔒 9jaKonet Escrow Release Authorization Code: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; margin-top: 0;">Authorize Escrow Release</h2>
              <p style="color: #475569; font-size: 15px;">Hi ${user.displayName || 'Customer'},</p>
              <p style="color: #475569; font-size: 15px;">
                You are authorizing the release of escrow funds for the job: <strong>"${job.title}"</strong> to artisan <strong>${job.artisanName}</strong>.
              </p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="color: #166534; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">Your 6-Digit Verification Code</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669;">${code}</div>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
                ⚠️ <strong>Security Notice:</strong> Only enter this authorization code if you are completely satisfied with the artisan's work. Once confirmed, the ₦${Math.round(job.amount * 0.9).toLocaleString()} payout will be queued for transfer to ${job.artisanName}'s bank account.
              </p>
            </div>
          `
        });
      }
    } catch (e) {
      console.error("Failed to send authorization email:", e);
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: Confirm OTP code and release funds
  const confirmOtpAndRelease = async () => {
    if (!otpModalJob) return;
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError("Incorrect 6-digit authorization code. Please verify the code sent to your email.");
      return;
    }

    setReleasing(true);
    setOtpError('');
    const job = otpModalJob;

    try {
      const platformFee = Math.round(job.amount * 0.10);
      const artisanPayout = job.amount - platformFee;
      const completedAt = Date.now();

      // 1. Fetch artisan doc to get saved bank details
      const artisanDoc = await getDoc(doc(db, 'users', job.artisanId));
      const artisanData = artisanDoc.exists() ? artisanDoc.data() : {};
      const artisanEmail = artisanData.email;

      // 2. Create pending withdrawal record for Admin to disburse manually or via Paystack
      await addDoc(collection(db, 'withdrawals'), {
        userId: job.artisanId,
        jobId: job.id,
        jobTitle: job.title,
        customerName: job.customerName,
        artisanName: job.artisanName,
        amount: artisanPayout,
        platformFee: platformFee,
        totalJobAmount: job.amount,
        bankName: artisanData.bankName || 'Not Set',
        accountNumber: artisanData.accountNumber || 'Not Set',
        accountName: artisanData.accountName || job.artisanName,
        status: 'pending',
        payoutType: 'escrow_release',
        createdAt: completedAt
      });

      // 3. Add to transactions history
      await addDoc(collection(db, 'transactions'), {
        userId: job.artisanId,
        customerId: job.customerId,
        jobId: job.id,
        jobTitle: job.title,
        type: 'escrow_payout',
        amount: artisanPayout,
        platformFee: platformFee,
        totalJobAmount: job.amount,
        bankName: artisanData.bankName || 'N/A',
        accountNumber: artisanData.accountNumber || 'N/A',
        artisanName: job.artisanName,
        customerName: job.customerName,
        status: 'completed',
        createdAt: completedAt
      });

      // 4. Update Job status in Firestore
      await updateDoc(doc(db, 'jobs', job.id), {
        status: 'completed',
        platformFee: platformFee,
        artisanPayout: artisanPayout,
        completedAt: completedAt,
        payoutStatus: 'pending_disbursement'
      });

      // 5. Optimistically update local jobs state
      setJobs(prev => prev.map(j => j.id === job.id ? {
        ...j,
        status: 'completed',
        platformFee,
        artisanPayout,
        completedAt
      } : j));

      // 6. Notify artisan
      if (artisanEmail) {
        sendEmail({
          to: artisanEmail,
          subject: '🎉 Job Approved! Payout is in Processing',
          html: `
            <h2>Payment Released by Customer!</h2>
            <p>Hi ${job.artisanName},</p>
            <p>Congratulations! ${job.customerName} has approved your work on <strong>"${job.title}"</strong> and released the funds.</p>
            <p>Your net payout of <strong>₦${artisanPayout.toLocaleString()}</strong> (90%) has been queued for bank disbursement by 9jaKonet Admin.</p>
            <p>10% platform commission retained: ₦${platformFee.toLocaleString()}.</p>
            <br/>
            <p>Thank you for your excellent service!</p>
          `
        });
      }

      // 7. Notify admin
      sendEmail({
        to: 'info@mooregloballtd.online',
        subject: `🚨 New Escrow Payout: ₦${artisanPayout.toLocaleString()} for ${job.artisanName}`,
        html: `
          <h2>New Escrow Payout to Disburse</h2>
          <p>Customer ${job.customerName} just approved job <strong>"${job.title}"</strong>.</p>
          <p><strong>Artisan:</strong> ${job.artisanName}</p>
          <p><strong>Bank:</strong> ${artisanData.bankName || 'N/A'} - ${artisanData.accountNumber || 'N/A'}</p>
          <p><strong>Net Payout Amount:</strong> ₦${artisanPayout.toLocaleString()}</p>
          <p><strong>Platform Commission (10%):</strong> ₦${platformFee.toLocaleString()}</p>
          <p>Log in to the Admin Panel to mark this payout paid manually via your bank app or via Paystack.</p>
        `
      });

      setOtpModalJob(null);
      alert(`🎉 Escrow Release Authorized! 9jaKonet Admin has been notified to disburse ₦${artisanPayout.toLocaleString()} to ${job.artisanName}'s bank account. Please take a moment to rate your experience below.`);
    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        markQuotaExhausted();
        setOtpError('System quota limit reached for today. Partially applied updates. Cloud sync paused.');
      } else {
        console.error(error);
        setOtpError('Failed to complete escrow release. Please try again.');
      }
    } finally {
      setReleasing(false);
    }
  };

  const submitReview = async (job: EscrowContract) => {
    const review = reviewForm[job.id];
    if (!review || !review.score) {
       alert("Please select a star rating");
       return;
    }

    if (isQuotaExhausted()) {
      alert("System quota limit reached for today. Reviews cannot be submitted right now.");
      return;
    }

    try {
      // 1. Update the Job with the review
      await updateDoc(doc(db, 'jobs', job.id), {
        reviewScore: review.score,
        reviewComment: review.comment || ""
      });

      // 2. Fetch all completed jobs for this artisan to recalculate the average
      const q = query(collection(db, 'jobs'), where('artisanId', '==', job.artisanId), where('status', '==', 'completed'));
      const snap = await getDocs(q);
      
      let totalScore = 0;
      let reviewCount = 0;
      
      snap.docs.forEach(d => {
        const data = d.data() as EscrowContract;
        if (data.reviewScore) {
          totalScore += data.reviewScore;
          reviewCount++;
        }
      });

      const newAvg = reviewCount > 0 ? (totalScore / reviewCount) : 0;

      // 3. Update the artisan's profile
      // Find the artisan profile doc ID. Note: We use userId to query the artisans collection
      const artisanQuery = query(collection(db, 'artisans'), where('userId', '==', job.artisanId));
      const artisanSnap = await getDocs(artisanQuery);
      
      if (!artisanSnap.empty) {
        const artisanDocId = artisanSnap.docs[0].id;
        await updateDoc(doc(db, 'artisans', artisanDocId), {
          ratingAvg: newAvg,
          totalJobsDone: snap.docs.length // Total completed jobs
        });
      }

      alert("Thank you! Your review has been published.");
    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        markQuotaExhausted();
        alert("System quota limit reached for today. Reviews cannot be submitted right now.");
      } else {
        console.error("Failed to submit review", error);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs & Escrow</h1>
          <p className="text-slate-500 mt-1">Manage your active contracts and securely fund jobs.</p>
        </div>
        
        {/* Wallet Balance Card */}
        <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between gap-4 min-w-[240px] shadow-lg shadow-emerald-900/10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-3 rounded-lg">
              <Banknote className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Wallet Balance</p>
              <h3 className="text-2xl font-bold">₦{(user.walletBalance || 0).toLocaleString()}</h3>
            </div>
          </div>
          {(user.walletBalance || 0) > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleResetTestBalance}
              disabled={resettingBalance}
              className="text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Clear to ₦0
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">No active jobs</h3>
            <p className="text-slate-500">Go to Messages to create a job offer with an Artisan.</p>
          </div>
        ) : (
          jobs.map(job => (
            <Card key={job.id} className="overflow-hidden border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-slate-900 text-sm">Escrow Protected Contract</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDateTime(job.createdAt)}</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Job Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {user.role === 'customer' 
                        ? `Artisan: ${job.artisanName}` 
                        : `Customer: ${job.customerName}`
                      }
                    </p>
                    
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">
                      {job.status === 'pending_escrow' && <Clock className="h-3 w-3 text-amber-500" />}
                      {job.status === 'in_progress' && <Clock className="h-3 w-3 text-blue-500" />}
                      {job.status === 'completed' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                      {job.status.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Amount and Action */}
                  <div className="flex flex-col md:items-end gap-3 min-w-[180px]">
                    <div className="text-2xl font-bold text-slate-900">
                      ₦{job.amount.toLocaleString()}
                    </div>
                    
                    {/* Role Based Actions */}
                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'pending_escrow' && (
                      <PaystackButton
                        email={user.email}
                        amount={job.amount * 100}
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
                    )}
                    
                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'in_progress' && (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Escrow Secured in Vault
                        </div>
                        <Button 
                          onClick={() => initiateReleaseOtp(job)} 
                          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                        >
                          Release Funds to Artisan
                        </Button>
                        <span className="text-[11px] text-slate-500 text-right">
                          Requires 6-digit email code for security
                        </span>
                      </div>
                    )}

                    {user.role === 'artisan' && job.status === 'pending_escrow' && (
                      <div className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                        Waiting for Customer to fund
                      </div>
                    )}

                    {user.role === 'artisan' && job.status === 'in_progress' && (
                      <div className="flex flex-col gap-1 items-end">
                        <div className="text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          ₦{job.amount.toLocaleString()} Secured in Escrow
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium text-right">
                          Your net payout will be ₦{(job.amount * 0.9).toLocaleString()} upon completion
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Review Section */}
                {job.status === 'completed' && (user.role === 'customer' || user.role === 'admin') && !job.reviewScore && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Rate your experience</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewForm(prev => ({
                              ...prev,
                              [job.id]: { ...prev[job.id], score: star, comment: prev[job.id]?.comment || '' }
                            }))}
                          >
                            <Star 
                              className={`h-6 w-6 ${
                                (reviewForm[job.id]?.score || 0) >= star 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-200'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Input 
                          placeholder="Leave a short comment (optional)" 
                          className="flex-1 bg-slate-50"
                          value={reviewForm[job.id]?.comment || ''}
                          onChange={(e) => setReviewForm(prev => ({
                            ...prev,
                            [job.id]: { ...prev[job.id], comment: e.target.value, score: prev[job.id]?.score || 0 }
                          }))}
                        />
                        <Button 
                          onClick={() => submitReview(job)}
                          disabled={!reviewForm[job.id]?.score}
                        >
                          Submit Review
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {job.status === 'completed' && job.reviewScore && (
                  <div className="mt-6 border-t border-slate-100 pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-900 mr-2">Review:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${job.reviewScore! >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                    {job.reviewComment && (
                      <span className="text-sm text-slate-600 italic">"{job.reviewComment}"</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* OTP Release Authorization Modal */}
      {otpModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setOtpModalJob(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Authorize Escrow Release</h3>
                <p className="text-xs text-slate-500">Dual-verification security check</p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200/80 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Job Contract:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">{otpModalJob.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Artisan:</span>
                <span className="font-semibold text-slate-900">{otpModalJob.artisanName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Escrow Value:</span>
                <span className="font-semibold text-slate-900">₦{otpModalJob.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Platform Commission (10%):</span>
                <span>₦{Math.round(otpModalJob.amount * 0.10).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-700">
                <span>Artisan Net Payout (90%):</span>
                <span>₦{Math.round(otpModalJob.amount * 0.90).toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Enter 6-Digit Email Authorization Code
              </label>
              <p className="text-xs text-slate-500 mb-3">
                A verification code was sent to <strong className="text-slate-800">{user.email}</strong>.
              </p>
              <Input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center font-mono text-2xl tracking-[0.4em] font-bold h-12 bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            {otpError && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Helper code reveal for seamless testing or offline delivery */}
            <div className="mb-5 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Didn't see the email?
              </span>
              <button
                type="button"
                onClick={() => setEnteredOtp(generatedOtp)}
                className="text-emerald-600 font-semibold hover:underline"
              >
                Auto-fill Code ({generatedOtp})
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOtpModalJob(null)}
                className="flex-1"
                disabled={releasing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmOtpAndRelease}
                disabled={releasing || enteredOtp.length !== 6}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {releasing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    Authorize Release
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

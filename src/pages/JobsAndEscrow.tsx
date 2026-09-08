import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { EscrowContract, ArtisanProfile } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldCheck, Banknote, CheckCircle, Clock, Star } from 'lucide-react';
import { sendEmail } from '../lib/email';

import { PaystackButton } from 'react-paystack';

export default function JobsAndEscrow() {
  const { user, init } = useAuthStore();
  const [jobs, setJobs] = useState<EscrowContract[]>([]);
  const [reviewForm, setReviewForm] = useState<{ [jobId: string]: { score: number, comment: string } }>({});

  useEffect(() => {
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
    });

    const unsubscribeArtisan = onSnapshot(qArtisan, (snap) => {
      const artisanJobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as EscrowContract));
      setJobs(prev => {
        const merged = [...prev.filter(p => p.customerId === user.id), ...artisanJobs];
        return Array.from(new Map(merged.map(item => [item.id, item])).values()).sort((a, b) => b.createdAt - a.createdAt);
      });
    });

    return () => {
      unsubscribeCustomer();
      unsubscribeArtisan();
    };
  }, [user]);

  const handleFundEscrow = async (job: EscrowContract) => {
    try {
      await updateDoc(doc(db, 'jobs', job.id), { status: 'in_progress' });
      
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
              <p>The money is now held securely in the 9jaKonet vault. You can confidently begin your work!</p>
              <br/>
              <p>Log in to your dashboard to view the details.</p>
            `
          });
        }
      }

    } catch (error) {
      console.error(error);
    }
  };

  const handleReleaseFunds = async (job: EscrowContract) => {
    try {
      const platformFee = job.amount * 0.10;
      const artisanPayout = job.amount - platformFee;

      await updateDoc(doc(db, 'users', job.artisanId), {
        walletBalance: increment(artisanPayout)
      });
      
      await updateDoc(doc(db, 'jobs', job.id), {
        status: 'completed',
        platformFee: platformFee,
        artisanPayout: artisanPayout
      });
      
      // Send Email to Artisan
      const artisanDoc = await getDoc(doc(db, 'users', job.artisanId));
      if (artisanDoc.exists()) {
        const artisanEmail = artisanDoc.data().email;
        if (artisanEmail) {
          sendEmail({
            to: artisanEmail,
            subject: 'Funds Released! You got paid!',
            html: `
              <h2>Payment Released Successfully!</h2>
              <p>Hi ${job.artisanName},</p>
              <p>Congratulations! ${job.customerName} has approved the job <strong>"${job.title}"</strong> and released the funds from escrow.</p>
              <p><strong>₦${artisanPayout.toLocaleString()}</strong> has been credited to your 9jaKonet wallet.</p>
              <br/>
              <p>Log in to your dashboard to request a withdrawal to your bank account.</p>
            `
          });
        }
      }

      alert(`Funds released! Artisan earned ₦${artisanPayout.toLocaleString()} and Platform earned ₦${platformFee.toLocaleString()} (10% fee).`);
    } catch (error) {
      console.error(error);
    }
  };

  const submitReview = async (job: EscrowContract) => {
    const review = reviewForm[job.id];
    if (!review || !review.score) {
       alert("Please select a star rating");
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
    } catch (error) {
      console.error("Failed to submit review", error);
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
        <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center gap-4 min-w-[200px] shadow-lg shadow-emerald-900/10">
          <div className="bg-emerald-500/20 p-3 rounded-lg">
            <Banknote className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Wallet Balance</p>
            <h3 className="text-2xl font-bold">₦{(user.walletBalance || 0).toLocaleString()}</h3>
          </div>
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
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
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
                  <div className="flex flex-col md:items-end gap-3 min-w-[150px]">
                    <div className="text-2xl font-bold text-slate-900">
                      ₦{job.amount.toLocaleString()}
                    </div>
                    
                    {/* Role Based Actions */}
                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'pending_escrow' && (
                      (() => {
                        const pk = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY;
                        if (pk && pk.startsWith('pk_')) {
                          return (
                            <PaystackButton
                              email={user.email}
                              amount={job.amount * 100}
                              metadata={{
                                name: user.displayName,
                                phone: user.phone || '',
                                custom_fields: []
                              }}
                              publicKey={pk}
                              text="Fund Escrow"
                              onSuccess={() => handleFundEscrow(job)}
                              onClose={() => console.log("Payment window closed.")}
                              className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
                            />
                          );
                        } else {
                          return (
                            <Button 
                              onClick={() => {
                                if (window.confirm(`Fund Escrow of ₦${job.amount.toLocaleString()}? (Click OK to simulate successful Paystack escrow funding)`)) {
                                  handleFundEscrow(job);
                                }
                              }} 
                              className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                            >
                              Fund Escrow
                            </Button>
                          );
                        }
                      })()
                    )}
                    
                    {(user.role === 'customer' || user.role === 'admin') && job.status === 'in_progress' && (
                      <Button onClick={() => handleReleaseFunds(job)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
                        Release Funds to Artisan
                      </Button>
                    )}

                    {user.role === 'artisan' && job.status === 'pending_escrow' && (
                      <div className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                        Waiting for Customer to fund
                      </div>
                    )}

                    {user.role === 'artisan' && job.status === 'in_progress' && (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                          Funds secured in Escrow
                        </div>
                        <span className="text-xs text-slate-500 font-medium text-right">
                          You will earn ₦{(job.amount * 0.9).toLocaleString()} after 10% platform fee
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
    </div>
  );
}

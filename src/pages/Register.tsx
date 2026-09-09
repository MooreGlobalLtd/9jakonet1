import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { UserRole } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { user: currentUser, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');

  // If already logged in, show a friendly message
  if (currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <CardTitle className="mb-4 text-xl">You are already logged in</CardTitle>
          <p className="text-slate-600 mb-6">
            You are currently logged in as {currentUser.displayName} ({currentUser.role}). 
            To create a new Artisan account, you must log out first.
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>Log Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role,
          displayName: user.displayName,
          avatar: user.photoURL,
          createdAt: Date.now()
        });

        if (role === 'artisan') {
          // Initialize empty artisan profile
          await setDoc(doc(db, 'artisans', user.uid), {
            userId: user.uid,
            tradeCategory: '',
            yearsExp: 0,
            bio: '',
            serviceAreas: [],
            verificationStatus: 'pending',
            isAvailable: true,
            ratingAvg: 0,
            totalJobsDone: 0,
            priceRange: ''
          });
          navigate('/artisan-setup');
          return;
        }

        // Customer goes to mandatory KYC verification
        navigate('/verify-kyc');
        return;
      }
      
      // Existing user checks if verified
      const existingData = userDoc.data();
      if (!existingData.isKycVerified) {
        navigate('/verify-kyc');
        return;
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error);
      alert("Failed to sign up with Google: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join 9jaKonet NG today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${role === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setRole('customer')}
            >
              I need a service
            </button>
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${role === 'artisan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setRole('artisan')}
            >
              I am an Artisan
            </button>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-900 flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5">🛡️</span>
            <div>
              <p className="font-bold text-teal-950">Mandatory Security &amp; GPS Policy</p>
              <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                For community safety, all users (Artisans &amp; Customers) must verify their identity with a valid Nigerian document (NIN, Driver&apos;s License, or Voter&apos;s Card), capture a live selfie, and maintain active live GPS location while using 9jaKonet.
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium" 
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Sign up with Google"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

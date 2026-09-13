import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { UserRole, User } from '../types';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck, Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

export default function Register() {
  const navigate = useNavigate();
  const { user: currentUser, signOut, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState<string | null>(null);

  // Status & Error Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already logged in, show friendly status

  if (verificationEmailSent) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 shadow-sm border-slate-200">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="mb-3 text-2xl font-bold text-slate-900">Check Your Email</CardTitle>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 text-left">
            <h4 className="font-semibold text-amber-800 text-sm mb-1 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Important Warning
            </h4>
            <p className="text-sm text-amber-700">
              We just sent a verification link to <strong>{verificationEmailSent}</strong>.
              <br/><br/>
              <strong>Did not see it?</strong> Please check your <strong>Spam or Junk folder</strong> immediately. It might be hiding there! If it is, mark it as "Not Spam".
            </p>
          </div>
          <Button className="w-full h-11" onClick={() => navigate('/login')}>
            Go to Login Page
          </Button>
        </Card>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 shadow-sm border-slate-200">
          <CardTitle className="mb-3 text-xl font-bold text-slate-900">You are already logged in</CardTitle>
          <p className="text-slate-600 mb-6 text-sm">
            You are currently logged in as <strong className="text-slate-900">{currentUser.displayName || currentUser.email}</strong> ({currentUser.role}). 
            To create a new account, please log out first.
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate(currentUser.role === 'artisan' ? '/dashboard' : '/explore')}>
              Go to {currentUser.role === 'artisan' ? 'Artisan Dashboard' : 'Explore Artisans'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const validateForm = (): boolean => {
    setErrorMessage('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full legal name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid Nigerian phone number (e.g. 08012345678).');
      return false;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return false;
    }
    return true;
  };

  // 1. Email & Password Registration
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 1.5 Create the user in Firestore database so they have a profile
      const newUser: User = {
        id: userCredential.user.uid,
        email: email.trim(),
        displayName: fullName.trim(),
        role: role,
        createdAt: Date.now(),
        walletBalance: 0,
        isKycVerified: false
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      // 2. Send verification email
      await sendEmailVerification(userCredential.user);
      
      // 3. Do not sign them in automatically
      await firebaseSignOut(auth);
      
      // 4. Show verification screen
      setVerificationEmailSent(email.trim());
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error?.code === 'auth/email-already-in-use') {
        setErrorMessage("User already exists. Please sign in");
      } else {
        setErrorMessage(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Registration
  const handleGoogleSignup = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await signInWithPopup(auth, googleProvider);
      // For now: Authenticate users only, Do NOT save user profile data
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Google Signup error:", error);
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setErrorMessage(error.message || "Failed to sign up with Google");
      }
    } finally {
      setLoading(false);
    }
  };

    // Verification Screen
  if (verificationEmailSent) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4 py-8 bg-slate-50/50">
        <Card className="w-full max-w-md shadow-md border-slate-200 text-center py-10 px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 mb-3">Check your inbox</CardTitle>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            We have sent you a verification email to <span className="font-semibold text-slate-900">{verificationEmailSent}</span>. Please verify it and log in.
          </p>
          <Button 
            onClick={() => navigate('/login')} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
          >
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4 py-8 bg-slate-50/50">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Create Your Account</CardTitle>
          <CardDescription className="text-slate-600">Join 9jaKonet to hire or work across Nigeria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Role Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              I am registering as:
            </label>
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
                  role === 'customer' 
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setRole('customer')}
              >
                👤 Customer / Client
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
                  role === 'artisan' 
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setRole('artisan')}
              >
                🛠️ Verified Artisan
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleEmailSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="text"
                  placeholder="e.g. Mark Joe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (Nigeria) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="tel"
                  placeholder="e.g. 08012345678 or +234..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs mt-2" 
              disabled={loading}
            >
              {loading ? "Creating Account, Please Wait..." : `Sign Up as ${role === 'artisan' ? 'Artisan' : 'Customer'}`}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">Or</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Google Sign In Option */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-10 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50" 
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign up with Google
          </Button>

          <p className="text-center text-xs text-slate-500 pt-1">
            Already have a 9jaKonet account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:underline">
              Log in here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

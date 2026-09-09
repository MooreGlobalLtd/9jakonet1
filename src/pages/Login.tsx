import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

export default function Login() {
  const navigate = useNavigate();
  const { user: currentUser, signOut, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  // If already logged in, show a friendly message
  if (currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 shadow-sm border-slate-200">
          <CardTitle className="mb-3 text-xl font-bold text-slate-900">You are already logged in</CardTitle>
          <p className="text-slate-600 mb-6 text-sm">
            Logged in as <strong className="text-slate-900">{currentUser.displayName || currentUser.email}</strong> ({currentUser.role}). 
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>Log Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  // 1. Email & Password Sign In
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // If a user logs in and their email is not verified, block access and show the verification screen.
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        setUnverifiedEmail(email.trim());
        return;
      }
      
      // Profile loading is handled by authStore
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-login-credentials') {
        setErrorMessage("Email or password is incorrect");
      } else {
        setErrorMessage(error.message || "Email or password is incorrect");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Sign In
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await signInWithPopup(auth, googleProvider);
      
      // Profile loading is handled by authStore
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setErrorMessage("Google Sign-In failed: " + (error.message || "Please use email and password above."));
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetStatus('Password reset link sent! Check your inbox.');
    } catch (err: any) {
      setResetStatus('Error sending reset email: ' + (err.message || 'Please check the address.'));
    }
  };

    // Verification Screen
  if (unverifiedEmail) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4 py-8 bg-slate-50/50">
        <Card className="w-full max-w-md shadow-md border-slate-200 text-center py-10 px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 mb-3">Verify your email</CardTitle>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            We have sent you a verification email to <span className="font-semibold text-slate-900">{unverifiedEmail}</span>. Please verify it and log in.
          </p>
          <Button 
            onClick={() => {
              setUnverifiedEmail(null);
              setPassword('');
            }} 
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
          <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-slate-600">Log in to your 9jaKonet account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setShowResetModal(true); setResetEmail(email); }}
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs mt-2" 
              disabled={loading}
            >
              {loading ? "Signing in, please wait..." : "Log In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">Or</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-10 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </Button>
          
          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-600">
              Enter your registered email address and we will send you a link to reset your password.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <Input 
                type="email" 
                placeholder="yourname@example.com" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              {resetStatus && (
                <p className="text-xs text-emerald-700 font-medium">{resetStatus}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowResetModal(false)}>
                  Close
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 text-white">
                  Send Reset Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { user: currentUser, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // If already logged in, show a friendly message
  if (currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <CardTitle className="mb-4 text-xl">You are already logged in</CardTitle>
          <p className="text-slate-600 mb-6">
            You are currently logged in as {currentUser.displayName} ({currentUser.role}). 
            To log in as a different user, you must log out first.
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>Log Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create customer profile by default if they don't exist
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'customer',
          displayName: user.displayName,
          avatar: user.photoURL,
          createdAt: Date.now()
        });
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      alert("Failed to login with Google: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Log in to your 9jaKonet NG account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Continue with Google"}
          </Button>
          
          <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';
import KonetBot from '../chat/KonetBot';
import LiveLocationWatcher from '../security/LiveLocationWatcher';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, ArrowRight, Instagram } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AppLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Quick-fix: Automatically correct any corrupted negative wallet balances.
    // If the system previously double-deducted, reset the local and remote state to 0 so the artisan isn't "in debt".
    if (user && (user.walletBalance || 0) < 0) {
      updateDoc(doc(db, 'users', user.id), { walletBalance: 0 })
        .then(() => {
          useAuthStore.setState({ user: { ...user, walletBalance: 0 } });
        })
        .catch(err => console.error("Could not correct negative balance", err));
    }
  }, [user]);

  const showKycPrompt = user && !user.isKycVerified && user?.kyc?.status !== 'verified' && user?.kyc?.status !== 'pending' && location.pathname !== '/verify-kyc';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {/* Live Location Security Service */}
      <LiveLocationWatcher />

      {/* Mandatory KYC Verification Banner for unverified users */}
      {showKycPrompt && (
        <div 
          id="kyc-verification-required-alert"
          className="bg-emerald-900 text-white px-4 py-2 text-xs sm:text-sm font-medium flex flex-wrap items-center justify-between gap-2 shadow-inner border-b border-emerald-800"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Security Action Required:</strong> Verify your identity with your <strong>NIN / Nigerian ID</strong> and <strong>Live Selfie</strong> to unlock jobs, escrow, and bookings.
            </span>
          </div>
          <Link 
            to="/verify-kyc" 
            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs transition-colors shrink-0"
          >
            Verify Identity Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center justify-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/9jakonet?stkn=dXN6Z29sczZucm03&utm_source=qr" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-500 transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
          <div>&copy; {new Date().getFullYear()} 9jaKonet NG. All rights reserved.</div>
        </div>
      </footer>
      {/* Active AI Support Assistant */}
      <KonetBot />
    </div>
  );
}

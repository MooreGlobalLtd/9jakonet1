import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Wrench, Menu, X, UserCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">9jaKonet <span className="text-emerald-600">NG</span></span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/explore" className="hover:text-emerald-600">Explore</Link>
          <Link to="/how-it-works" className="hover:text-emerald-600">How it Works</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              {(user.role === 'admin' || (user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')) && (
                <Link to="/admin" className="font-semibold text-amber-600 hover:text-amber-700">Admin Panel</Link>
              )}
              
              <Link to="/jobs" className="hover:text-emerald-600">Jobs & Escrow</Link>
              <Link to="/messages" className="hover:text-emerald-600">Messages</Link>
              <Link to="/dashboard" className="hover:text-emerald-600">Dashboard</Link>
              
              <Link to="/wallet" className="flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                ₦{(user.walletBalance || 0).toLocaleString()}
              </Link>

              {user.isKycVerified ? (
                <Link to="/verify-kyc" className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified
                </Link>
              ) : (
                <Link to="/verify-kyc" className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300 transition-colors">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Verify ID
                </Link>
              )}

              <Button variant="outline" onClick={signOut}>Sign Out</Button>
              <Link to="/profile">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <UserCircle className="h-8 w-8 text-slate-400" />
                )}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="sm" className="px-2" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link 
            to="/explore" 
            onClick={closeMenu} 
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
          >
            Explore
          </Link>
          <Link 
            to="/how-it-works" 
            onClick={closeMenu} 
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
          >
            How it Works
          </Link>

          {user ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {(user.role === 'admin' || (user.email === 'ayorindesamuel705@gmail.com' || user.email === 'info@mooregloballtd.online')) && (
                <Link to="/admin" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-semibold text-amber-600 hover:bg-amber-50">
                  Admin Panel
                </Link>
              )}
              <Link to="/jobs" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                Jobs & Escrow
              </Link>
              <Link to="/messages" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                Messages
              </Link>
              <Link to="/dashboard" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                Dashboard
              </Link>
              <Link to="/wallet" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                Wallet: ₦{(user.walletBalance || 0).toLocaleString()}
              </Link>
              <Link to="/verify-kyc" onClick={closeMenu} className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                <span>Identity & Location Verification</span>
                {user.isKycVerified ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Verify Now</span>
                )}
              </Link>
              <Link to="/profile" onClick={closeMenu} className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <UserCircle className="h-7 w-7 text-slate-400" />
                )}
                <span>My Profile</span>
              </Link>
              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => { signOut(); closeMenu(); }}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Link to="/login" onClick={closeMenu} className="w-full">
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link to="/register" onClick={closeMenu} className="w-full">
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Wrench, Menu, X, UserCircle, ShieldCheck, ShieldAlert, Bell, CheckCircle2 } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [notifications, setNotifications] = useState<{id: string, text: string, time: number, isRead: boolean, link: string}[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadChatsCount(0);
      setNotifications([]);
      setUnreadNotifCount(0);
      return;
    }

    // 1. Unread Chats
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id)
    );

    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastSenderId && data.lastSenderId !== user.id && data.isRead === false) {
          count++;
        }
      });
      setUnreadChatsCount(count);
    });

    // 2. Real-time Notifications (Escrows)
    const fieldQuery = user.role === 'customer' ? 'customerId' : 'artisanId';
    const qEscrows = query(collection(db, 'escrows'), where(fieldQuery, '==', user.id));
    
    const unsubscribeEscrows = onSnapshot(qEscrows, (snapshot) => {
       const notifs: any[] = [];
       snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'pending_escrow') {
             notifs.push({
               id: doc.id + '_pending',
               text: user.role === 'customer' ? `Fund escrow for ${data.title}` : `Customer created escrow for ${data.title}`,
               time: data.createdAt,
               isRead: false,
               link: '/jobs'
             });
          }
          if (data.status === 'in_progress' && user.role === 'artisan') {
             notifs.push({
               id: doc.id + '_progress',
               text: `Escrow funded for ${data.title}! You can start working.`,
               time: data.createdAt + 1000,
               isRead: false,
               link: '/jobs'
             });
          }
          if (data.status === 'completed') {
             notifs.push({
               id: doc.id + '_completed',
               text: `Job ${data.title} marked completed. Funds released.`,
               time: data.createdAt + 2000,
               isRead: false,
               link: '/wallet'
             });
          }
       });
       
       // Sort by time descending
       notifs.sort((a, b) => b.time - a.time);
       setNotifications(notifs.slice(0, 5));
       setUnreadNotifCount(notifs.filter(n => !n.isRead).length);
    });

    return () => {
      unsubscribeChats();
      unsubscribeEscrows();
    };
  }, [user]);

  const markNotifsAsRead = () => {
     setUnreadNotifCount(0);
     setNotifications(prev => prev.map(n => ({...n, isRead: true})));
  };
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
              <Link to="/messages" className="relative hover:text-emerald-600">
                Messages
                {unreadChatsCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" className="hover:text-emerald-600">Dashboard</Link>
              
                            <div className="relative group">
                <button 
                  onMouseEnter={markNotifsAsRead}
                  className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
                
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <span className="text-xs text-slate-500">{notifications.length} Recent</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2 opacity-50" />
                        No new notifications
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map((notif) => (
                          <Link 
                            key={notif.id} 
                            to={notif.link}
                            className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 items-start ${notif.isRead ? 'opacity-70' : 'bg-emerald-50/30'}`}
                          >
                            <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5 shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 leading-snug">{notif.text}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(notif.time).toLocaleDateString()}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <Link to="/dashboard" className="block text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 p-2">
                      View Dashboard
                    </Link>
                  </div>
                </div>
              </div>

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
        <div className="md:hidden flex items-center gap-1">
          {user && (
            <Link 
              to="/dashboard" 
              onClick={markNotifsAsRead}
              className="relative p-2 text-slate-600 hover:text-emerald-600 rounded-full flex items-center justify-center"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </Link>
          )}
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
              <Link to="/messages" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                <span>Messages</span>
                {unreadChatsCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                <span>Notifications</span>
                {unreadNotifCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadNotifCount}
                  </span>
                )}
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

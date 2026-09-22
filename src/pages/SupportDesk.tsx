import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LiveSupportDesk from '../components/admin/LiveSupportDesk';
import { subscribeToSupportTickets } from '../lib/supportService';
import { requestBrowserNotificationPermission, showDevicePushNotification } from '../lib/notifications';
import { 
  Headphones, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Sparkles,
  HelpCircle,
  Bell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function SupportDesk() {
  const { user, loading } = useAuthStore();
  const [waitingCount, setWaitingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    const unsubscribe = subscribeToSupportTickets((tickets) => {
      setWaitingCount(tickets.filter(t => t.status === 'waiting').length);
      setActiveCount(tickets.filter(t => t.status === 'agent_active').length);
      setResolvedCount(tickets.filter(t => t.status === 'resolved').length);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Loading Support Desk...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authorization Check:
  // Must be either an appointed Support Agent OR Super Admin
  const isSuperAdmin = user.role === 'admin' || 
    user.email === 'ayorindesamuel705@gmail.com' || 
    user.email === 'support@9jakonet.com' || 
    user.email === 'info@mooregloballtd.online';
    
  const isApprovedAgent = Boolean(user.isSupportAgent || user.role === 'support_agent');

  if (!isSuperAdmin && !isApprovedAgent) {
    toast.error('Access restricted. Only appointed 9jaKonet Support Agents can access this desk.');
    return <Navigate to="/dashboard" replace />;
  }

  const handleEnablePush = async () => {
    const res = await requestBrowserNotificationPermission(user.id);
    if (res) {
      setPushStatus(res);
      if (res === 'granted') {
        showDevicePushNotification('🎧 Support Alerts Active', {
          body: 'You will receive immediate alerts whenever a customer requests a live agent on 9jaKonet.',
          link: '/support-desk'
        });
        toast.success('Real-time phone push alerts active on this device!');
      } else {
        toast.error('Notification permission was not granted.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6 border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                Live Desk Workspace
              </span>
              {isSuperAdmin && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Super Admin View
                </span>
              )}
              {isApprovedAgent && !isSuperAdmin && (
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Official Support Agent
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Headphones className="h-7 w-7 text-emerald-400" />
              9jaKonet Live Support Desk
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Welcome, <strong className="text-white">{user.displayName || user.email}</strong>. As an authorized 9jaKonet Support Representative, you can chat with customers, visitors, and artisans in real time to guide them with escrows, OTP releases, and finding verified artisans.
            </p>
          </div>

          {/* Quick Push Notification Check */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-2 shrink-0 md:w-72">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-emerald-400" />
                Device Alerts:
              </span>
              {pushStatus === 'granted' ? (
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Off
                </span>
              )}
            </div>
            
            <p className="text-[11px] text-slate-300 leading-snug">
              Turn on push alerts to hear instant ringtones whenever a customer requests an agent.
            </p>

            {pushStatus !== 'granted' && (
              <Button
                size="sm"
                onClick={handleEnablePush}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8 rounded-xl flex items-center gap-1.5 mt-1 cursor-pointer"
              >
                <Smartphone className="h-3.5 w-3.5 text-slate-950" />
                <span>Enable Alerts</span>
              </Button>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3" /> Waiting Queue
            </p>
            <p className="text-2xl font-black text-white mt-0.5">{waitingCount}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Radio className="h-3 w-3" /> Active Chats
            </p>
            <p className="text-2xl font-black text-white mt-0.5">{activeCount}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Resolved
            </p>
            <p className="text-2xl font-black text-white mt-0.5">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-6 overflow-hidden">
        <LiveSupportDesk currentUser={user} />
      </div>
    </div>
  );
}

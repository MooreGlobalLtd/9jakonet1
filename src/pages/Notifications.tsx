import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink, 
  Radio, 
  ShieldCheck, 
  Briefcase, 
  MessageSquare, 
  Sparkles,
  Zap,
  Filter,
  AlertCircle
} from 'lucide-react';
import { 
  requestBrowserNotificationPermission, 
  showDevicePushNotification, 
  subscribeDeviceToPush 
} from '../lib/notifications';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  source: 'direct' | 'broadcast' | 'escrow';
  title: string;
  body: string;
  link?: string;
  type?: 'general' | 'escrow' | 'message' | 'offer' | 'inspection_request' | string;
  read: boolean;
  createdAt: number;
}

export default function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'broadcast' | 'escrow'>('all');
  const [pushStatus, setPushStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushStatus(Notification.permission);
    }
  }, []);

  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      const res = await requestBrowserNotificationPermission();
      if (res) {
        setPushStatus(res);
        if (res === 'granted') {
          if (user?.id) {
            await subscribeDeviceToPush(user.id);
          }
          toast.success('🎉 Phone Push Alerts enabled! You will now receive lock screen notifications.');
          showDevicePushNotification('🔔 9jaKonet Notifications Active', {
            body: 'Your device is configured to receive instant notifications and updates.',
            link: '/notifications',
            tag: 'device-test'
          });
        } else {
          toast.error('Notification permission was blocked in your browser settings.');
        }
      }
    } catch (err) {
      console.error('Error enabling push:', err);
      toast.error('Failed to enable push notifications.');
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleSendTestNotification = () => {
    showDevicePushNotification('🔔 Test Notification', {
      body: 'This is a sample pop-up notification from 9jaKonet on your device!',
      link: '/notifications',
      tag: 'sample-test'
    });
    toast.success('Test alert sent to your device!');
  };

  // Real-time listener for user direct notifications, system broadcasts, and escrow events
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let directList: NotificationItem[] = [];
    let broadcastList: NotificationItem[] = [];
    let escrowList: NotificationItem[] = [];

    const updateAll = () => {
      const combined = [...directList, ...broadcastList, ...escrowList];
      // Deduplicate by ID
      const uniqueMap = new Map<string, NotificationItem>();
      for (const item of combined) {
        uniqueMap.set(item.id, item);
      }
      const uniqueList = Array.from(uniqueMap.values());
      uniqueList.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(uniqueList);
      setLoading(false);
    };

    // 1. Direct user notifications
    const qDirect = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id)
    );
    const unsubDirect = onSnapshot(qDirect, (snap) => {
      directList = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          source: 'direct',
          title: data.title || 'Notification',
          body: data.body || '',
          link: data.link || '/dashboard',
          type: data.type || 'general',
          read: Boolean(data.read),
          createdAt: data.createdAt || Date.now()
        };
      });
      updateAll();
    }, (err) => {
      console.error('Direct notifs listener error:', err);
      setLoading(false);
    });

    // 2. System-wide broadcasts (ALL_USERS)
    const qBroadcast = query(
      collection(db, 'notifications'),
      where('userId', '==', 'ALL_USERS')
    );
    const unsubBroadcast = onSnapshot(qBroadcast, (snap) => {
      broadcastList = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          source: 'broadcast',
          title: data.title || 'System Announcement',
          body: data.body || '',
          link: data.link || '/dashboard',
          type: 'general',
          read: Boolean(data.read),
          createdAt: data.createdAt || Date.now()
        };
      });
      updateAll();
    }, (err) => {
      console.error('Broadcast listener error:', err);
    });

    // 3. Escrow contracts updates
    const fieldQuery = user.role === 'customer' ? 'customerId' : 'artisanId';
    const qEscrows = query(collection(db, 'escrows'), where(fieldQuery, '==', user.id));
    const unsubEscrow = onSnapshot(qEscrows, (snap) => {
      escrowList = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'pending_escrow') {
          escrowList.push({
            id: `escrow_${docSnap.id}_pending`,
            source: 'escrow',
            title: user.role === 'customer' ? 'Escrow Ready: Deposit Required' : 'Customer Created Escrow Request',
            body: user.role === 'customer'
              ? `Please fund the ₦${(data.amount || 0).toLocaleString()} escrow for "${data.title}" to protect your job transaction.`
              : `Customer initiated an escrow contract of ₦${(data.amount || 0).toLocaleString()} for "${data.title}".`,
            link: '/jobs',
            type: 'escrow',
            read: false,
            createdAt: data.createdAt || Date.now()
          });
        } else if (data.status === 'in_progress') {
          escrowList.push({
            id: `escrow_${docSnap.id}_progress`,
            source: 'escrow',
            title: 'Escrow Funded & In Progress',
            body: user.role === 'artisan'
              ? `₦${(data.amount || 0).toLocaleString()} is securely held in escrow for "${data.title}". You may safely execute the service!`
              : `Your funds (₦${(data.amount || 0).toLocaleString()}) are securely held in escrow for "${data.title}". Artisan has started work.`,
            link: '/jobs',
            type: 'escrow',
            read: false,
            createdAt: (data.createdAt || Date.now()) + 500
          });
        } else if (data.status === 'completed') {
          escrowList.push({
            id: `escrow_${docSnap.id}_completed`,
            source: 'escrow',
            title: 'Job Completed & Escrow Released',
            body: `Funds for "${data.title}" have been successfully released. Check your wallet balance.`,
            link: '/wallet',
            type: 'escrow',
            read: true,
            createdAt: (data.createdAt || Date.now()) + 1000
          });
        }
      });
      updateAll();
    }, (err) => {
      console.error('Escrows listener error:', err);
    });

    return () => {
      unsubDirect();
      unsubBroadcast();
      unsubEscrow();
    };
  }, [user?.id, user?.role]);

  // Mark single notification as read
  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.source === 'direct') {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { read: true });
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      if (user?.id) {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.id),
          where('read', '==', false)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach(d => {
          batch.update(doc(db, 'notifications', d.id), { read: true });
        });
        await batch.commit();
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all as read.');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (item: NotificationItem) => {
    if (item.source === 'direct') {
      try {
        await deleteDoc(doc(db, 'notifications', item.id));
        toast.success('Notification removed.');
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    }
    setNotifications(prev => prev.filter(n => n.id !== item.id));
  };

  // Filter logic
  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'unread') return !item.read;
    if (activeTab === 'broadcast') return item.source === 'broadcast' || item.type === 'general' || item.title.includes('📢') || item.title.includes('🔔');
    if (activeTab === 'escrow') return item.type === 'escrow' || item.source === 'escrow';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Notifications &amp; Updates
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Real-time alerts, job requests, escrow settlements, and system announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <CheckCheck className="h-4 w-4 text-emerald-600" />
              Mark all read
            </Button>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin#push-broadcast">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5"
              >
                <Radio className="h-4 w-4 text-amber-600" />
                Admin Dispatcher
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Phone Push Notifications Status Banner */}
      <Card className="mb-6 border-slate-200 overflow-hidden shadow-sm">
        <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          pushStatus === 'granted' 
            ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 text-white' 
            : 'bg-amber-50 border-b border-amber-200 text-slate-900'
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              pushStatus === 'granted' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-200 text-amber-800'
            }`}>
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${pushStatus === 'granted' ? 'text-emerald-400' : 'text-amber-900'}`}>
                  {pushStatus === 'granted' ? 'Phone Push Notifications Active' : 'Phone Push Notifications Inactive'}
                </span>
                {pushStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Not Enabled
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${pushStatus === 'granted' ? 'text-slate-300' : 'text-amber-800'}`}>
                {pushStatus === 'granted'
                  ? 'Your device receives pop-ups and vibration alerts for job updates, messages, and admin announcements.'
                  : 'Turn on phone alerts so you receive alerts on your lock screen even when this app or browser is closed.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pushStatus === 'granted' ? (
              <Button
                type="button"
                size="sm"
                onClick={handleSendTestNotification}
                variant="outline"
                className="border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Test Phone Pop-up
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleEnablePush}
                disabled={isEnablingPush}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Smartphone className="h-3.5 w-3.5" />
                {isEnablingPush ? 'Enabling...' : 'Enable Phone Alerts'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Updates</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {notifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'unread' ? 'bg-white text-emerald-800' : 'bg-red-500 text-white'}`}>
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>System &amp; Announcements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('escrow')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'escrow'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Escrow &amp; Jobs</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300 bg-white">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">You are all caught up!</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'unread'
              ? 'No unread notifications. You have viewed all your alerts.'
              : 'No notifications in this category yet. When updates, job alerts, or system broadcasts arrive, they will appear here.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/explore">
              <Button variant="outline" size="sm">Explore Artisans</Button>
            </Link>
            <Link to="/marketplace">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Visit Marketplace</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isBroadcast = notif.source === 'broadcast' || notif.type === 'general' || notif.title.includes('📢') || notif.title.includes('🔔');
            const isEscrow = notif.type === 'escrow' || notif.source === 'escrow';

            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif)}
                className={`group relative rounded-xl border p-4 sm:p-5 transition-all duration-200 ${
                  notif.read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-emerald-50/40 border-emerald-300/80 shadow-xs ring-1 ring-emerald-500/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category Icon */}
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isBroadcast
                      ? 'bg-amber-100 text-amber-700'
                      : isEscrow
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isBroadcast ? (
                      <Radio className="h-4 w-4" />
                    ) : isEscrow ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold tracking-tight ${notif.read ? 'text-slate-800' : 'text-slate-900'}`}>
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                      {notif.body}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/80">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isBroadcast
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isEscrow
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isBroadcast ? 'Broadcast' : isEscrow ? 'Escrow Alert' : 'Direct Update'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {notif.link && (
                          <Link
                            to={notif.link}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}

                        {notif.source === 'direct' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notif);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors ml-1"
                            title="Delete alert"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

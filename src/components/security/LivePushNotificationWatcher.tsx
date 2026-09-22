import { useEffect, useRef, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { 
  registerNotificationServiceWorker, 
  showDevicePushNotification, 
  requestBrowserNotificationPermission,
  subscribeDeviceToPush
} from '../../lib/notifications';
import { Bell, X, Smartphone } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function LivePushNotificationWatcher() {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const initialLoadRef = useRef(true);
  const processedBroadcastIdsRef = useRef<Set<string>>(new Set());
  const lastProcessedTimeRef = useRef(Date.now() - 5 * 60 * 1000); // Check within last 5 minutes
  const syncedUserIdRef = useRef<string | null>(null);

  // 1. Check support, register worker, auto-subscribe if permitted, and prompt banner
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);
    registerNotificationServiceWorker();

    // If permission was already granted, ensure Web Push subscription is registered & synced
    if (Notification.permission === 'granted') {
      subscribeDeviceToPush(user?.id);
    } else if (Notification.permission === 'default') {
      // Display the activation prompt after a short delay
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('9jakonet_notif_prompt_dismissed');
        if (!dismissed) {
          setShowPromptBanner(true);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  // 2. Safely sync push active status and userId to server and user document
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!user?.id) return;
    if (syncedUserIdRef.current === user.id) return;

    syncedUserIdRef.current = user.id;

    // Sync Web Push subscription with authenticated userId
    subscribeDeviceToPush(user.id);

    // Mark active in the users collection
    if (!user.pushNotificationsActive) {
      updateDoc(doc(db, 'users', user.id), {
        pushNotificationsActive: true,
        lastActiveDeviceSync: Date.now()
      }).catch(() => {});
    }
  }, [user?.id, user?.pushNotificationsActive]);

  // 3. Listen to real-time personal notifications for the logged in user
  useEffect(() => {
    if (!user?.id) return;

    try {
      const notifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt || 0;

            if (createdAt >= lastProcessedTimeRef.current) {
              lastProcessedTimeRef.current = createdAt;

              // Native device push notification to phone lock screen & status bar
              showDevicePushNotification(data.title || '9jaKonet Alert', {
                body: data.body || 'You have a new update.',
                link: data.link || '/dashboard',
                tag: data.type || '9jakonet-push'
              });

              // In-app toast banner
              toast(data.title || '9jaKonet Alert', {
                description: data.body,
                action: data.link ? {
                  label: 'View',
                  onClick: () => {
                    window.location.href = data.link;
                  }
                } : undefined
              });
            }
          }
        });
      }, (err) => {
        console.warn('Real-time notification listener note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to attach live notification listener:', e);
    }
  }, [user?.id]);

  // 4. Listen to system-wide broadcasts & Admin test alerts sent to ALL_USERS
  useEffect(() => {
    try {
      const broadcastQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', 'ALL_USERS'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(broadcastQuery, (snapshot) => {
        const lastSeen = Number(localStorage.getItem('9jakonet_last_seen_broadcast') || 0);

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const docId = change.doc.id;
            const data = change.doc.data();
            const createdAt = data.createdAt || 0;

            // Avoid duplicate pop-ups for the same alert
            if (processedBroadcastIdsRef.current.has(docId)) {
              return;
            }
            processedBroadcastIdsRef.current.add(docId);

            // Pop up if new or sent recently within the last 15 minutes and not acknowledged
            const isRecent = createdAt > (Date.now() - 15 * 60 * 1000);
            const isNewerThanLastSeen = createdAt > lastSeen;

            if (isRecent && isNewerThanLastSeen) {
              localStorage.setItem('9jakonet_last_seen_broadcast', String(createdAt));

              // Trigger native device push notification for broadcast
              showDevicePushNotification(data.title || '📢 9jaKonet Announcement', {
                body: data.body || 'Important platform update from 9jaKonet.',
                link: data.link || '/dashboard',
                tag: '9jakonet-broadcast'
              });

              // Also display in-app toast
              toast(data.title || '📢 9jaKonet Announcement', {
                description: data.body,
                duration: 6000,
                action: data.link ? {
                  label: 'Open',
                  onClick: () => {
                    window.location.href = data.link;
                  }
                } : undefined
              });
            }
          }
        });
      }, (err) => {
        console.warn('Real-time broadcast listener note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to attach broadcast notification listener:', e);
    }
  }, []);

  // 5. Listen to Support/Admin notifications (Live Support Requests) if current user is admin OR support agent
  useEffect(() => {
    const isAuthorized = Boolean(
      user && (
        user.role === 'admin' ||
        user.role === 'support_agent' ||
        user.isSupportAgent ||
        user.email === 'ayorindesamuel705@gmail.com' ||
        user.email === 'support@9jakonet.com' ||
        user.email === 'info@mooregloballtd.online'
      )
    );

    if (!isAuthorized) return;

    try {
      const adminQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', 'ADMIN'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(adminQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt || 0;

            if (createdAt >= lastProcessedTimeRef.current) {
              lastProcessedTimeRef.current = createdAt;

              const targetLink = (user?.isSupportAgent || user?.role === 'support_agent') && user?.email !== 'ayorindesamuel705@gmail.com'
                ? '/support-desk'
                : '/admin';

              showDevicePushNotification(data.title || '🎧 Live Support Request!', {
                body: data.body || 'A user is waiting on KonetBot.',
                link: targetLink,
                tag: 'admin-live-support'
              });

              toast(data.title || '🎧 Live Support Request!', {
                description: data.body,
                duration: 9000,
                action: {
                  label: 'Open Desk',
                  onClick: () => {
                    window.location.href = targetLink;
                  }
                }
              });
            }
          }
        });
      }, (err) => {
        console.warn('Admin notification listener note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to attach admin notification listener:', e);
    }
  }, [user?.role, user?.email, user?.isSupportAgent]);

  const handleEnableNotifications = async () => {
    const res = await requestBrowserNotificationPermission(user?.id);
    if (res) {
      setPermission(res);
      setShowPromptBanner(false);
      if (res === 'granted') {
        await subscribeDeviceToPush(user?.id);
        toast.success('🔔 Phone alerts activated! Your device will receive real-time push notifications even when away.');
        if (user?.id) {
          updateDoc(doc(db, 'users', user.id), {
            pushNotificationsActive: true,
            lastActiveDeviceSync: Date.now()
          }).catch(() => {});
        }
      } else if (res === 'denied') {
        toast.error('Notifications blocked by browser settings. Please enable notifications in your browser/phone settings.');
      }
    }
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    localStorage.setItem('9jakonet_notif_prompt_dismissed', 'true');
  };

  if (!showPromptBanner || permission !== 'default') {
    return null;
  }

  // Check if iOS non-standalone (where PWA installation is required for push)
  const isIos = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-emerald-500/30 flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
        <Bell className="h-5 w-5 animate-pulse" />
      </div>
      <div className="flex-1 text-xs">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm text-emerald-400">Receive Updates On Your Phone</p>
          <button onClick={handleDismiss} className="text-slate-400 hover:text-white p-1" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-slate-300 mt-1 leading-relaxed">
          Get real-time pop-up alerts on your phone for new messages, jobs, and platform updates—even when the app is closed.
        </p>

        {isIos && !isStandalone && (
          <div className="mt-2 p-2 bg-emerald-950/60 rounded-lg border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span>iPhone tip: Tap Share ➔ <strong>&apos;Add to Home Screen&apos;</strong> to enable phone lock-screen alerts!</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleEnableNotifications}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold h-8 rounded-lg shadow-md cursor-pointer"
          >
            Turn On Phone Alerts
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white text-xs h-8 cursor-pointer"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}

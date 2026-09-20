import { useEffect, useRef, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { 
  registerNotificationServiceWorker, 
  showDevicePushNotification, 
  requestBrowserNotificationPermission 
} from '../../lib/notifications';
import { Bell, X } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function LivePushNotificationWatcher() {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const initialLoadRef = useRef(true);
  const broadcastInitialLoadRef = useRef(true);
  const lastProcessedTimeRef = useRef(Date.now());

  // 1. Check support and current permission
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);
    registerNotificationServiceWorker();

    // If permission is already granted and we have a logged-in user, save push status to Firestore
    if (Notification.permission === 'granted' && user?.id) {
      updateDoc(doc(db, 'users', user.id), {
        pushNotificationsActive: true,
        lastActiveDeviceSync: Date.now()
      }).catch(() => {});
    }

    // If permission is default, display the polite one-tap activation prompt after a short delay
    if (Notification.permission === 'default') {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('9jakonet_notif_prompt_dismissed');
        if (!dismissed) {
          setShowPromptBanner(true);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // 2. Listen to real-time personal notifications for the logged in user
  useEffect(() => {
    if (!user || !user.id) return;

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
  }, [user]);

  // 3. Listen to system-wide broadcasts & Admin test alerts sent to ALL_USERS
  useEffect(() => {
    try {
      const broadcastQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', 'ALL_USERS'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(broadcastQuery, (snapshot) => {
        if (broadcastInitialLoadRef.current) {
          broadcastInitialLoadRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt || 0;

            if (createdAt >= lastProcessedTimeRef.current) {
              lastProcessedTimeRef.current = createdAt;

              // Fire native device push notification for admin broadcast
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

  const handleEnableNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    if (res) {
      setPermission(res);
      setShowPromptBanner(false);
      if (res === 'granted') {
        toast.success('Push notifications active! You will receive all updates on your phone lock screen.');
        if (user?.id) {
          updateDoc(doc(db, 'users', user.id), {
            pushNotificationsActive: true,
            lastActiveDeviceSync: Date.now()
          }).catch(() => {});
        }
      } else if (res === 'denied') {
        toast.error('Notifications blocked by browser settings. You can re-enable them in your browser site settings.');
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

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-emerald-500/30 flex items-start gap-3 backdrop-blur-md">
      <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
        <Bell className="h-5 w-5" />
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
        <div className="mt-3 flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleEnableNotifications}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold h-8 rounded-lg shadow-md"
          >
            Turn On Phone Alerts
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white text-xs h-8"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}

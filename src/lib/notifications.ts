import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  link?: string;
  type?: 'offer' | 'message' | 'inspection_request' | 'escrow' | 'general';
}

/**
 * Utility: Convert URL-safe base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register background service worker for mobile PWA push notifications
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('Service worker registration note:', err);
    return null;
  }
}

/**
 * Subscribes the current device to the Web Push Manager and registers with server & Firestore.
 * This enables the device to receive background lock screen & heads-up push notifications.
 */
export async function subscribeDeviceToPush(userId?: string): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    await registerNotificationServiceWorker();
    const reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) {
      return null;
    }

    // 1. Check existing subscription
    let subscription = await reg.pushManager.getSubscription();

    // 2. If no subscription, retrieve public VAPID key and subscribe
    if (!subscription) {
      const keyRes = await fetch('/api/push/vapid-public-key');
      const keyData = await keyRes.json();
      if (!keyData.success || !keyData.publicKey) {
        throw new Error('Could not retrieve VAPID key');
      }

      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // 3. Register subscription on the Express server and Firestore
    if (subscription) {
      const subJson = subscription.toJSON();
      
      // Sync to Express Server
      fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subJson,
          userId: userId || null,
          userAgent: navigator.userAgent
        })
      }).catch(err => console.warn('[Push] Server sync note:', err));

      // Also persist to Firestore 'pushSubscriptions'
      try {
        const endpointHash = btoa(subscription.endpoint.slice(-36)).replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'pushSubscriptions', endpointHash), {
          endpoint: subscription.endpoint,
          keys: subJson.keys,
          userId: userId || null,
          userAgent: navigator.userAgent,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        // Non-blocking
      }
    }

    return subscription;
  } catch (err) {
    console.warn('[Push] Subscription registration note:', err);
    return null;
  }
}

/**
 * Request system / browser push notification permission and initialize push subscription
 */
export async function requestBrowserNotificationPermission(userId?: string): Promise<NotificationPermission | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  try {
    // Ensure service worker is registered
    await registerNotificationServiceWorker();
    
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      await subscribeDeviceToPush(userId);
    }

    return permission;
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return null;
  }
}

/**
 * Displays a native device push notification via Service Worker or Desktop Notification API
 */
export async function showDevicePushNotification(title: string, options: {
  body: string;
  icon?: string;
  badge?: string;
  link?: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/pwa-192x192.png',
    tag: options.tag || '9jakonet-alert',
    vibrate: [200, 100, 200],
    data: {
      url: options.link || '/'
    }
  };

  // 1. Try Service Worker showNotification first (standard for mobile devices & PWAs)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (e) {
      console.warn('SW showNotification fallback:', e);
    }
  }

  // 2. Fallback to standard window Notification
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      if (options.link) {
        window.location.href = options.link;
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Failed to fire native notification:', err);
    return false;
  }
}

/**
 * Dispatch an in-app & Firestore notification to a user,
 * plus trigger native phone push via server backend.
 */
export async function sendInAppNotification(payload: NotificationPayload): Promise<void> {
  try {
    // 1. Persist to Firestore notifications collection
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      read: false,
      createdAt: Date.now()
    });

    // 2. Send targeted background push via server
    fetch('/api/push/send-to-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        link: payload.link || '/dashboard',
        tag: payload.type || '9jakonet'
      })
    }).catch(err => console.warn('[Push] Targeted push send note:', err));

    // 3. Local fallback notification if on same device
    showDevicePushNotification(payload.title, {
      body: payload.body,
      link: payload.link,
      tag: payload.type || '9jakonet'
    }).catch(() => {});
  } catch (err) {
    console.warn('Failed to send in-app notification:', err);
  }
}

/**
 * Broadcasts a push alert to ALL registered user phones and connected devices
 */
export async function triggerGlobalBroadcastPush(payload: {
  title: string;
  body: string;
  link?: string;
  tag?: string;
}): Promise<{ success: boolean; sentCount: number; totalDevices: number }> {
  try {
    const res = await fetch('/api/push/send-to-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        link: payload.link || '/dashboard',
        tag: payload.tag || '9jakonet-broadcast'
      })
    });
    return await res.json();
  } catch (err: any) {
    console.error('Failed to trigger broadcast push:', err);
    return { success: false, sentCount: 0, totalDevices: 0 };
  }
}

/**
 * Triggers a test push notification to verify phone alerts work
 */
export async function sendTestPushNotification(): Promise<boolean> {
  const perm = await requestBrowserNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  // Broadcast to devices
  triggerGlobalBroadcastPush({
    title: '9jaKonet Alert Active! 🔔',
    body: 'Your phone will now receive real-time updates for messages, escrow, and new inquiries even when away from the app.',
    link: '/dashboard',
    tag: 'test-alert'
  });

  return showDevicePushNotification('9jaKonet Alert Active! 🔔', {
    body: 'Your phone will now receive real-time updates for messages, escrow, and new inquiries even when away from the app.',
    link: '/dashboard',
    tag: 'test-alert'
  });
}

/**
 * Formats a Nigerian or international phone number for WhatsApp direct link
 */
export function formatWhatsAppUrl(phone?: string, message?: string): string | null {
  if (!phone) return null;
  
  // Clean all non-digit characters except leading +
  let clean = phone.replace(/[^\d+]/g, '');
  if (!clean) return null;

  // Handle Nigerian local format e.g. 08031234567 -> 2348031234567
  if (clean.startsWith('0') && clean.length === 11) {
    clean = '234' + clean.slice(1);
  } else if (clean.startsWith('+')) {
    clean = clean.slice(1);
  } else if (!clean.startsWith('234') && clean.length === 10) {
    clean = '234' + clean;
  }

  const encodedMsg = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${clean}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

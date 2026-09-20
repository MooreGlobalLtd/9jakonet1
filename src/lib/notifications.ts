import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  link?: string;
  type?: 'offer' | 'message' | 'inspection_request' | 'escrow' | 'general';
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
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Request system / browser push notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  try {
    // Ensure service worker is registered
    await registerNotificationServiceWorker();
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
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
 * plus fire a native mobile/browser push notification if permitted.
 */
export async function sendInAppNotification(payload: NotificationPayload): Promise<void> {
  try {
    // 1. Persist to Firestore notifications collection
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      read: false,
      createdAt: Date.now()
    });

    // 2. Trigger native device push notification if permission is granted
    await showDevicePushNotification(payload.title, {
      body: payload.body,
      link: payload.link,
      tag: payload.type || '9jakonet'
    });
  } catch (err) {
    console.warn('Failed to send in-app notification:', err);
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

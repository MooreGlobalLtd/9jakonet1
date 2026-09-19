import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  link?: string;
  type?: 'offer' | 'message' | 'inspection_request' | 'escrow' | 'general';
}

/**
 * Request system / browser push notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  try {
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
 * Dispatch an in-app & Firestore notification to a user,
 * plus fire a native browser push notification if permitted.
 */
export async function sendInAppNotification(payload: NotificationPayload): Promise<void> {
  try {
    // 1. Persist to Firestore notifications collection
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      read: false,
      createdAt: Date.now()
    });

    // 2. Fire native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(payload.title, {
          body: payload.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: payload.type || 'marketplace'
        });
        notif.onclick = () => {
          window.focus();
          if (payload.link) {
            window.location.href = payload.link;
          }
          notif.close();
        };
      } catch (pushErr) {
        console.warn('Native notification trigger failed:', pushErr);
      }
    }
  } catch (err) {
    console.warn('Failed to send in-app notification:', err);
  }
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

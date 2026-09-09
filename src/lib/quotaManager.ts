/**
 * Firestore Quota & Graceful Degradation Manager
 * 
 * When the free tier daily write quota (20,000 writes/day) is reached on Firebase,
 * this utility allows the application to smoothly fall back to in-memory and 
 * localStorage persistence without throwing uncaught errors or spamming retries.
 */

const QUOTA_EXHAUSTED_KEY = '9jakonet_firestore_quota_exhausted_ts';
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown before attempting writes again

export function markQuotaExhausted() {
  try {
    sessionStorage.setItem(QUOTA_EXHAUSTED_KEY, String(Date.now()));
  } catch {
    // Ignore storage issues
  }
}

export function clearQuotaExhausted() {
  try {
    sessionStorage.removeItem(QUOTA_EXHAUSTED_KEY);
  } catch {
    // Ignore storage issues
  }
}

export function isQuotaExhausted(): boolean {
  try {
    const raw = sessionStorage.getItem(QUOTA_EXHAUSTED_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    if (Date.now() - ts < QUOTA_COOLDOWN_MS) {
      return true;
    }
    // Expired, clear and retry
    sessionStorage.removeItem(QUOTA_EXHAUSTED_KEY);
    return false;
  } catch {
    return false;
  }
}

/**
 * Helper to safely wrap Firestore writes with quota protection
 */
export async function safeFirestoreWrite<T>(writeFn: () => Promise<T>, fallbackValue?: T): Promise<T | undefined> {
  if (isQuotaExhausted()) {
    console.info('Firestore daily write quota is currently exhausted. Operation handled in local session.');
    return fallbackValue;
  }

  try {
    return await writeFn();
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' || 
      err?.message?.includes('Quota limit exceeded') ||
      err?.message?.includes('quota')
    ) {
      console.warn('Firestore write quota reached. Marking session to local persistence fallback.');
      markQuotaExhausted();
      return fallbackValue;
    }
    throw err;
  }
}

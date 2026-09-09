const QUOTA_EXHAUSTED_KEY = '9jakonet_firestore_quota_exhausted_ts';

export function markQuotaExhausted() { }
export function clearQuotaExhausted() { }
export function isQuotaExhausted(): boolean {
  return false;
}

export async function safeFirestoreWrite<T>(writeFn: () => Promise<T>, fallbackValue?: T): Promise<T | undefined> {
  try {
    return await writeFn();
  } catch (err: any) {
    throw err;
  }
}

export function resetQuotaManually() { }

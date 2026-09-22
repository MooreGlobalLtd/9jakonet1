import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  increment, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { User, ReferralRecord } from '../types';
import { sendEmail } from './email';
import { showDevicePushNotification } from './notifications';

export type { ReferralRecord };

export const REWARD_PER_THREE_REFERRALS = 3000;
export const REFERRALS_PER_MILESTONE = 3;

/**
 * Generates a clean, human-friendly referral code for a user
 * e.g. KONET-SAMUEL-6F3C
 */
export function generateReferralCode(displayName?: string, userId?: string): string {
  const namePart = (displayName || 'MEMBER')
    .trim()
    .split(' ')[0]
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6) || 'USER';
  
  const idPart = (userId || Math.random().toString(36).substring(2, 6))
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4);

  return `KONET-${namePart}-${idPart}`;
}

/**
 * Looks up a referrer by their referral code
 */
export async function getReferrerByCode(rawCode: string): Promise<User | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', code));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as User;
    }

    // Secondary fallback: check if user typed an exact user ID or custom handle
    const directDoc = await getDoc(doc(db, 'users', code));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...directDoc.data() } as User;
    }

    return null;
  } catch (err) {
    console.warn('Error finding referrer by code:', err);
    return null;
  }
}

/**
 * Records a new referral when a user completes signup
 */
export async function recordNewReferral(params: {
  referrer: User;
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
  referralCode: string;
}): Promise<void> {
  const { referrer, newUserId, newUserName, newUserEmail, referralCode } = params;

  // Prevent self-referral
  if (referrer.id === newUserId || referrer.email.toLowerCase() === newUserEmail.toLowerCase()) {
    return;
  }

  const now = Date.now();

  try {
    // 1. Create a referral document
    const referralsRef = collection(db, 'referrals');
    await addDoc(referralsRef, {
      referrerId: referrer.id,
      referrerName: referrer.displayName || '9jaKonet Member',
      referrerEmail: referrer.email,
      referredUserId: newUserId,
      referredUserName: newUserName || 'New Member',
      referredUserEmail: newUserEmail,
      referralCode: referralCode.toUpperCase(),
      status: 'signed_up',
      createdAt: now
    });

    // 2. Update new user document with referredBy
    await updateDoc(doc(db, 'users', newUserId), {
      referredBy: referrer.id,
      referredByCode: referralCode.toUpperCase()
    });

    // 3. Increment referrer's referralCount
    await updateDoc(doc(db, 'users', referrer.id), {
      referralCount: increment(1)
    });

    // 4. Notify referrer in-app
    await addDoc(collection(db, 'notifications'), {
      userId: referrer.id,
      title: '🎁 New Referral Registered!',
      body: `${newUserName || 'A new user'} just signed up using your referral code. Once they complete identity verification (KYC), it will count towards your ₦3,000 reward!`,
      createdAt: now,
      isRead: false,
      link: '/wallet'
    });
  } catch (err) {
    console.error('Error recording new referral:', err);
  }
}

/**
 * Checks and awards ₦3,000 when a referred user is KYC-verified.
 * Triggered automatically when Admin or system approves an identity.
 */
export async function processKycReferralReward(verifiedUserId: string): Promise<{
  rewarded: boolean;
  referrerName?: string;
  verifiedCount?: number;
}> {
  try {
    // 1. Find the referral record for this verified user
    const referralsRef = collection(db, 'referrals');
    const q = query(
      referralsRef, 
      where('referredUserId', '==', verifiedUserId),
      where('status', '==', 'signed_up')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { rewarded: false };
    }

    const referralDoc = snap.docs[0];
    const referralData = referralDoc.data() as ReferralRecord;
    const referrerId = referralData.referrerId;
    const now = Date.now();

    // 2. Mark this referral as kyc_verified
    await updateDoc(doc(db, 'referrals', referralDoc.id), {
      status: 'kyc_verified',
      kycVerifiedAt: now
    });

    // 3. Increment referrer's verifiedReferralCount
    await updateDoc(doc(db, 'users', referrerId), {
      verifiedReferralCount: increment(1)
    });

    // 4. Fetch updated referrer details to calculate milestones
    const referrerDoc = await getDoc(doc(db, 'users', referrerId));
    if (!referrerDoc.exists()) {
      return { rewarded: false };
    }

    const referrer = referrerDoc.data() as User;
    const totalVerified = referrer.verifiedReferralCount || 1;
    const currentEarned = referrer.referralRewardsEarned || 0;
    const targetPayouts = Math.floor(totalVerified / REFERRALS_PER_MILESTONE) * REWARD_PER_THREE_REFERRALS;

    // 5. If new payout threshold reached!
    if (targetPayouts > currentEarned) {
      const payoutAmount = targetPayouts - currentEarned;

      // Credit wallet
      await updateDoc(doc(db, 'users', referrerId), {
        walletBalance: increment(payoutAmount),
        referralRewardsEarned: targetPayouts
      });

      // Mark the 3 referrals as rewarded
      await updateDoc(doc(db, 'referrals', referralDoc.id), {
        status: 'rewarded',
        rewardedAt: now,
        rewardAmount: payoutAmount
      });

      // Record wallet transaction
      await addDoc(collection(db, 'wallet_transactions'), {
        userId: referrerId,
        type: 'credit',
        category: 'referral_bonus',
        amount: payoutAmount,
        description: `🎉 Referral Milestone: ${REFERRALS_PER_MILESTONE} Friends KYC-Verified (₦${payoutAmount.toLocaleString()} Credited)`,
        createdAt: now
      });

      // Dispatch in-app notification
      await addDoc(collection(db, 'notifications'), {
        userId: referrerId,
        title: '🎉 ₦3,000 Referral Reward Credited!',
        body: `Congratulations! ${REFERRALS_PER_MILESTONE} of your referred friends have verified their identities. ₦${payoutAmount.toLocaleString()} has been credited to your 9jaKonet wallet!`,
        createdAt: now,
        isRead: false,
        link: '/wallet'
      });

      // Dispatch Push Notification
      showDevicePushNotification('🎉 ₦3,000 Referral Reward Credited!', {
        body: `Congratulations! Your 9jaKonet wallet has been credited with ₦${payoutAmount.toLocaleString()}.`,
        link: '/wallet',
        tag: 'referral-reward'
      });

      // Send Congratulations Email
      try {
        await sendEmail({
          to: referrer.email,
          subject: '🎉 You Earned ₦3,000 on 9jaKonet!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #047857; padding: 25px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">🎉 ₦3,000 Reward Credited!</h1>
              </div>
              <div style="padding: 25px; color: #334155; line-height: 1.6;">
                <p>Hello <strong>${referrer.displayName || '9jaKonet Member'}</strong>,</p>
                <p>Awesome news! <strong>3 of your referred friends</strong> have completed identity verification (KYC) on 9jaKonet.</p>
                <div style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 14px; color: #047857; font-weight: bold;">Wallet Credit:</span>
                  <h2 style="font-size: 32px; color: #047857; margin: 5px 0;">+₦${payoutAmount.toLocaleString()}</h2>
                  <p style="margin: 0; font-size: 12px; color: #059669;">Ready to spend on artisan hiring or withdraw to your bank account</p>
                </div>
                <p>Keep sharing your referral code to unlock another ₦3,000 for every 3 verified friends!</p>
                <a href="https://9jakonet.mooregloballtd.online/wallet" style="display: block; text-align: center; background-color: #047857; color: white; padding: 12px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 20px;">Open My Wallet</a>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.warn('Referral reward email note:', emailErr);
      }

      return {
        rewarded: true,
        referrerName: referrer.displayName,
        verifiedCount: totalVerified
      };
    }

    return {
      rewarded: false,
      referrerName: referrer.displayName,
      verifiedCount: totalVerified
    };
  } catch (err) {
    console.error('Error in processKycReferralReward:', err);
    return { rewarded: false };
  }
}

/**
 * Subscribes to a user's referred friends list
 */
export function subscribeToUserReferrals(
  userId: string,
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  const referralsRef = collection(db, 'referrals');
  const q = query(
    referralsRef,
    where('referrerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: ReferralRecord[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReferralRecord));
    callback(list);
  }, (err) => {
    console.warn('User referrals subscription note:', err);
  });
}

/**
 * Subscribes to all referrals across the platform (for Admin)
 */
export function subscribeToAllReferrals(
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  const referralsRef = collection(db, 'referrals');
  const q = query(referralsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: ReferralRecord[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReferralRecord));
    callback(list);
  }, (err) => {
    console.warn('All referrals subscription note:', err);
  });
}

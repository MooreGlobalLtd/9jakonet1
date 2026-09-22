import React, { useState, useEffect } from 'react';
import { User, ReferralRecord } from '../../types';
import { 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { subscribeToUserReferrals, REFERRALS_PER_MILESTONE, REWARD_PER_THREE_REFERRALS } from '../../lib/referralService';
import { toast } from 'sonner';

interface ReferralHubProps {
  user: User;
  variant?: 'full' | 'compact';
}

export default function ReferralHub({ user, variant = 'full' }: ReferralHubProps) {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = user.referralCode || `KONET-${user.displayName?.split(' ')[0]?.toUpperCase() || 'USER'}-${user.id?.slice(0, 4)?.toUpperCase() || 'PRO'}`;
  const inviteUrl = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToUserReferrals(user.id, (list) => {
      setReferrals(list);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const verifiedFriends = referrals.filter(r => r.status === 'kyc_verified' || r.status === 'rewarded');
  const pendingFriends = referrals.filter(r => r.status === 'signed_up');

  // Milestone calculations (e.g. 3 friends = ₦3,000)
  const currentBatchProgress = verifiedFriends.length % REFERRALS_PER_MILESTONE;
  const friendsNeededForNext = REFERRALS_PER_MILESTONE - currentBatchProgress;
  const totalEarned = user.referralRewardsEarned || 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success(`Referral code ${referralCode} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! 👋 I use 9jaKonet to find verified plumbers, electricians, mechanics, and artisans across Nigeria. All payments are held safely in Escrow so no artisan can run away with your money.\n\nSign up with my invite code: *${referralCode}*\nOr use my link:\n${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRemindFriendWhatsApp = (friendName: string) => {
    const text = encodeURIComponent(
      `Hello ${friendName}! 👋 Remember to upload your ID / NIN on 9jaKonet to complete your KYC verification. Once verified, your account gets the official Verified Shield badge! 🛡️`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (variant === 'compact') {
    return (
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white shadow-md overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Refer 3 Friends, Earn ₦3,000
                </h4>
                <p className="text-[11px] text-emerald-200/80">Credited upon KYC verification</p>
              </div>
            </div>
            <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              ₦{totalEarned.toLocaleString()} Earned
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Milestone Progress:</span>
              <span className="text-emerald-400 font-bold">
                {currentBatchProgress} / {REFERRALS_PER_MILESTONE} Verified ({friendsNeededForNext} more to next ₦3,000)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(currentBatchProgress / REFERRALS_PER_MILESTONE) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-300 truncate">{referralCode}</span>
              <button 
                type="button" 
                onClick={handleCopyCode} 
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy Code"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3 shrink-0 flex items-center gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-emerald-300 shadow-md bg-white overflow-hidden">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              <span>9jaKonet Viral Referral Program</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Refer 3 Friends &amp; Get <span className="text-amber-400">₦3,000</span> Instantly!
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Invite clients, artisans, or friends. For every <strong>3 friends</strong> who register and complete their identity verification (NIN / Government ID), <strong>₦3,000</strong> is automatically credited into your 9jaKonet wallet.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[200px] shrink-0 text-center">
            <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Total Rewards Earned</span>
            <div className="text-3xl font-black text-amber-400">
              ₦{totalEarned.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300 flex items-center justify-center gap-1.5 border-t border-white/10 pt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{verifiedFriends.length} Verified / {referrals.length} Invited</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-8">
        {/* Progress Milestone Card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Current Milestone: {currentBatchProgress} of {REFERRALS_PER_MILESTONE} Friends Verified
              </h4>
              <p className="text-xs text-slate-600">
                {friendsNeededForNext === 0 
                  ? "🎉 You've reached your milestone! Rewards are calculated upon verification." 
                  : `Just ${friendsNeededForNext} more verified friend(s) needed to unlock your next ₦3,000!`}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-black text-sm text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shrink-0">
              <Gift className="h-4 w-4 text-emerald-600" />
              Next: +₦3,000
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300 mb-2">
            <div 
              className="bg-gradient-to-r from-emerald-600 to-teal-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${(currentBatchProgress / REFERRALS_PER_MILESTONE) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>0 Friends</span>
            <span>1 Verified</span>
            <span>2 Verified</span>
            <span className="font-bold text-emerald-700">3 Verified (₦3,000 💰)</span>
          </div>
        </div>

        {/* Share Boxes (Code, Link & WhatsApp) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Your Unique Referral Code
              </label>
              <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-2.5">
                <span className="font-mono text-base font-black text-slate-900 tracking-wide select-all">
                  {referralCode}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="h-8 text-xs font-semibold gap-1.5 border-slate-300"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Friends can type this code during registration under "Referral Code".
            </p>
          </div>

          {/* Invite Link & WhatsApp Share */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Direct Invite Link
              </label>
              <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-2.5">
                <span className="font-mono text-xs text-slate-600 truncate mr-2 select-all">
                  {inviteUrl}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-8 text-xs font-semibold gap-1.5 border-slate-300 shrink-0"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleShareWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs h-9 flex items-center justify-center gap-2 shadow-xs"
            >
              <Share2 className="h-4 w-4" />
              Share Link on WhatsApp
            </Button>
          </div>
        </div>

        {/* How It Works 3-Step Guide */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-emerald-600" />
            How The ₦3,000 Referral Reward Works
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-black text-emerald-600 text-sm">1. Share Code</span>
              <p className="text-slate-600">Send your referral link or code to friends, family, or artisans in your neighborhood.</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-black text-emerald-600 text-sm">2. Complete KYC</span>
              <p className="text-slate-600">Referred friends must verify their identity (upload valid NIN or ID + live selfie) to prevent fraud.</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-black text-emerald-600 text-sm">3. Instant ₦3,000 Credit</span>
              <p className="text-slate-600">For every 3 friends verified, ₦3,000 lands in your wallet. Use it to hire artisans or withdraw to your bank!</p>
            </div>
          </div>
        </div>

        {/* Referred Friends Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Friends You Invited ({referrals.length})
            </h3>
            <span className="text-xs text-slate-500">
              {verifiedFriends.length} Verified • {pendingFriends.length} Pending
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Gift className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-800">No referrals yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Share your referral link on WhatsApp to get your first 3 friends onboard and unlock ₦3,000!
              </p>
              <Button size="sm" onClick={handleShareWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
                Share on WhatsApp Now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Friend</th>
                    <th className="px-4 py-3">Date Joined</th>
                    <th className="px-4 py-3">KYC Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((ref) => {
                    const isVerified = ref.status === 'kyc_verified' || ref.status === 'rewarded';
                    return (
                      <tr key={ref.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                              {ref.referredUserName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span>{ref.referredUserName}</span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {ref.referredUserEmail.replace(/(.{2})(.*)(?=@)/, '$1***')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(ref.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              Identity Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded text-[11px]">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Pending Verification
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isVerified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemindFriendWhatsApp(ref.referredUserName)}
                              className="h-7 text-[11px] border-emerald-300 text-emerald-800 hover:bg-emerald-50 inline-flex items-center gap-1"
                              title="Send reminder to complete ID verification"
                            >
                              <MessageSquare className="h-3 w-3 text-emerald-600" />
                              Remind
                            </Button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              Counted to ₦3k 🎉
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

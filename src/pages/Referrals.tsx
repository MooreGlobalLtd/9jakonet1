import React from 'react';
import { useAuthStore } from '../store/authStore';
import ReferralHub from '../components/referrals/ReferralHub';
import { Gift, ShieldCheck, Banknote, Users, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Referrals() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-purple-500/20">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            9jaKonet Viral Ambassador Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Refer 3 Friends. <br className="hidden sm:inline" />
            Earn <span className="text-amber-400">₦3,000 Cash</span> Straight To Your Wallet!
          </h1>
          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
            Invite fellow homeowners, clients, tradesmen, and artisans to 9jaKonet. For every 3 friends who sign up and complete their NIN or government ID verification, you receive an instant ₦3,000 credit in your wallet with zero withdrawal restrictions.
          </p>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-15 pointer-events-none hidden md:block">
          <Gift className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Main Interactive Referral Hub (Share Links, WhatsApp, Milestone Progress & Tracking) */}
      <ReferralHub user={user} variant="full" />

      {/* 3 Step Visual Guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          How The ₦3,000 Referral Program Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Share Your Unique Link</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Copy your personalized referral link or tap <strong>Share on WhatsApp</strong> to broadcast to your status, family, and group chats.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Friends Sign Up &amp; Verify</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your invited friends register and complete free ID verification (NIN or Government ID) to protect the marketplace from bots.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">Unlock ₦3,000 Per 3 Friends</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every 3 verified friends automatically trigger a <strong>₦3,000 instant payout</strong> to your wallet. Withdraw to any Nigerian bank anytime!
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-600" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
          <div className="pt-2">
            <h4 className="font-bold text-slate-900 mb-1">Is there a limit to how many times I can earn ₦3,000?</h4>
            <p className="text-slate-600">
              No limit! For every multiple of 3 verified friends (3, 6, 9, 12...), you earn another ₦3,000. Refer 30 friends and earn ₦30,000!
            </p>
          </div>

          <div className="pt-4">
            <h4 className="font-bold text-slate-900 mb-1">Why do my invited friends need to verify KYC?</h4>
            <p className="text-slate-600">
              To ensure 9jaKonet remains the safest artisan marketplace in Nigeria and to prevent fraudulent automated account creation, referral bonuses are disbursed once friends verify their identity with their NIN or government ID.
            </p>
          </div>

          <div className="pt-4">
            <h4 className="font-bold text-slate-900 mb-1">How can I withdraw my referral rewards?</h4>
            <p className="text-slate-600">
              Rewards are credited directly to your <Link to="/wallet" className="text-purple-600 font-semibold underline">9jaKonet Wallet</Link>. From there, you can request an instant withdrawal to your Nigerian bank account or use the funds to book artisans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

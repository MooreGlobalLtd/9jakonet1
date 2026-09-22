import { Link } from 'react-router-dom';
import { Instagram, Twitter, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand & Mission (2 cols on lg) */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 flex-shrink-0">
                <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                  <path d="M60 15 L20 30 L20 60 C20 85 50 100 60 105 C70 100 100 85 100 60 L100 30 Z" fill="none" stroke="#10b981" strokeWidth="12" strokeLinejoin="round" />
                  <g transform="translate(30, 26) scale(0.5)">
                    <path d="M65 30 A 20 20 0 1 1 45 50 A 20 20 0 0 1 65 30 Z" fill="none" stroke="#f59e0b" strokeWidth="18" />
                    <path d="M85 50 L85 85 A 20 20 0 0 1 45 85" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" />
                    <circle cx="85" cy="30" r="16" fill="#10b981" />
                  </g>
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-white">9jaKonet <span className="text-emerald-500">NG</span></span>
            </Link>
            
            <p className="text-sm leading-relaxed text-slate-400 mb-6 max-w-sm">
              Nigeria’s most trusted verified services marketplace and escrow platform. Connecting verified artisans, mechanics, technicians, and everyday buyers with 100% payment security.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-6">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              100% Escrow Protected Transactions
            </div>

            <div className="flex items-center gap-3">
              <a 
                href="https://www.instagram.com/9jakonet?stkn=dXN6Z29sczZucm03&utm_source=qr" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                title="Follow 9jaKonet on Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                title="Follow 9jaKonet on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors text-xs font-bold"
                title="Follow 9jaKonet on TikTok"
              >
                TikTok
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="hover:text-emerald-400 transition-colors">Explore Artisans</Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">Marketplace & Distress Sales</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/jobs" className="hover:text-emerald-400 transition-colors">Jobs & Escrow Tracking</Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-emerald-400 transition-colors">Wallet & Bank Payouts</Link>
              </li>
              <li>
                <Link to="/referrals" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors">
                  <span>🎁 Refer &amp; Earn ₦3,000</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Help & Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <a href="mailto:support@9jakonet.com" className="hover:text-emerald-400 transition-colors">
                  support@9jakonet.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <a href="tel:09021171832" className="hover:text-emerald-400 transition-colors">
                  09021171832
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Lagos, Nigeria (Nationwide Coverage)</span>
              </li>
              <li>
                <Link to="/how-it-works" className="text-emerald-400 hover:text-emerald-300 font-semibold block pt-1">
                  View Support & FAQ &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Security & Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/escrow-policy" className="hover:text-emerald-400 transition-colors">Escrow Protection Policy</Link>
              </li>
              <li>
                <Link to="/verify-kyc" className="hover:text-emerald-400 transition-colors">Artisan ID Verification (KYC)</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} 9jaKonet NG (Moore Global Ltd). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with pride for <span className="text-emerald-400 font-medium">Nigeria</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}

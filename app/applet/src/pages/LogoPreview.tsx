import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LogoPreview() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-semibold mb-8 hover:text-emerald-700">
        <ArrowLeft className="h-4 w-4" /> Back to App
      </Link>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">The Combined Concept</h1>
        <p className="text-slate-600 mb-12 text-lg max-w-3xl">
          Here is the combined logo! It features the <strong>Trust Shield</strong> on the outside, and the <strong>"9" Node</strong> safely secured inside it.
        </p>

        {/* FEATURED COMBINED CONCEPT */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-emerald-500 flex flex-col md:flex-row items-center gap-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
            COMBINED DESIGN
          </div>
          
          <div className="w-48 h-48 flex-shrink-0">
            <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
              <defs>
                <linearGradient id="grad4a" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
              </defs>
              {/* Shield */}
              <path d="M60 15 L20 30 L20 60 C20 85 50 100 60 105 C70 100 100 85 100 60 L100 30 Z" fill="none" stroke="url(#grad4a)" strokeWidth="12" strokeLinejoin="round" />
              {/* Inner 9 in Amber */}
              <g transform="translate(30, 26) scale(0.5)">
                <path d="M65 30 A 20 20 0 1 1 45 50 A 20 20 0 0 1 65 30 Z" fill="none" stroke="#f59e0b" strokeWidth="18" />
                <path d="M85 50 L85 85 A 20 20 0 0 1 45 85" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" />
                <circle cx="85" cy="30" r="16" fill="#10b981" />
              </g>
            </svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The "Verified 9" Shield</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              This combines the two best concepts. The outer green shield represents the safety, escrow, and verified trust of the platform. Inside, the amber "9" (which also looks like a network map pin) represents 9jaKonet and your connected artisans.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 p-6 rounded-2xl w-full sm:w-max">
              <div className="text-white text-sm font-medium sm:mr-4">Preview in Navbar:</div>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 drop-shadow-sm">
                  <path d="M60 15 L20 30 L20 60 C20 85 50 100 60 105 C70 100 100 85 100 60 L100 30 Z" fill="none" stroke="#10b981" strokeWidth="12" strokeLinejoin="round" />
                  <g transform="translate(30, 26) scale(0.5)">
                    <path d="M65 30 A 20 20 0 1 1 45 50 A 20 20 0 0 1 65 30 Z" fill="none" stroke="#f59e0b" strokeWidth="18" />
                    <path d="M85 50 L85 85 A 20 20 0 0 1 45 85" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" />
                    <circle cx="85" cy="30" r="16" fill="#10b981" />
                  </g>
                </svg>
                <span className="text-2xl font-bold tracking-tight text-white">9jaKonet</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-400 mb-6 uppercase tracking-wider text-sm">Previous Individual Concepts</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60 hover:opacity-100 transition-opacity">
          {/* CONCEPT 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-6">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M65 30 A 20 20 0 1 1 45 50 A 20 20 0 0 1 65 30 Z" fill="none" stroke="#059669" strokeWidth="16" />
                <path d="M85 50 L85 85 A 20 20 0 0 1 45 85" fill="none" stroke="#059669" strokeWidth="16" strokeLinecap="round" />
                <circle cx="85" cy="30" r="14" fill="#f59e0b" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Concept 1: The "9"</h2>
          </div>

          {/* CONCEPT 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-6">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M60 15 L20 30 L20 60 C20 85 50 100 60 105 C70 100 100 85 100 60 L100 30 Z" fill="none" stroke="#059669" strokeWidth="14" strokeLinejoin="round" />
                <path d="M40 55 L55 70 L80 40" fill="none" stroke="#f59e0b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Concept 2: Trust Shield</h2>
          </div>

          {/* CONCEPT 3 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-6">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M35 20 L35 100" fill="none" stroke="#059669" strokeWidth="16" strokeLinecap="round" />
                <path d="M85 20 L35 60 L85 100" fill="none" stroke="#059669" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="85" cy="20" r="12" fill="#f59e0b" />
                <circle cx="85" cy="100" r="12" fill="#f59e0b" />
                <circle cx="35" cy="60" r="12" fill="#f59e0b" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Concept 3: Network 'K'</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

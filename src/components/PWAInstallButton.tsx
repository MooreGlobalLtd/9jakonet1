import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'banner' }> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  if (isInstalled || dismissBanner) {
    return null;
  }

  // Navigation button style
  if (variant === 'nav') {
    if (isInstallable) {
      return (
        <button
          onClick={install}
          className="hidden md:flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            className="hidden md:flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
          
          {showIOSGuide && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative">
                <h3 className="text-lg font-semibold text-slate-900">Install on iPhone / iPad</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  1. Tap the <strong>Share</strong> button in your Safari toolbar.<br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </p>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-6 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200 transition"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </>
      );
    }
  }

  // Mobile banner style (shows at the bottom or top of mobile views)
  if (variant === 'banner' && (isInstallable || isIOS)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-700 text-white p-3 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between md:hidden">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">9jaKonet App</span>
          <span className="text-xs opacity-90">Install for a faster experience</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isInstallable) install();
              else setShowIOSGuide(true);
            }}
            className="bg-white text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm"
          >
            Install
          </button>
          <button onClick={() => setDismissBanner(true)} className="p-1 opacity-80 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 pb-6">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-slate-900">
              <h3 className="text-lg font-semibold mb-2">Install on iPhone</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tap the <span className="inline-block mx-1 border rounded px-1">Share</span> button at the bottom of Safari, then select <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

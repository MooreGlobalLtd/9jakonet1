import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MapPin, AlertTriangle, ShieldCheck, RefreshCw, Smartphone, Check, ChevronRight, X } from 'lucide-react';
import { Button } from '../ui/button';
import { getStateCoordinates } from '../../lib/nigerianLocations';

export default function LiveLocationWatcher() {
  const { user, setUser } = useAuthStore();
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [phoneOsTab, setPhoneOsTab] = useState<'android' | 'ios'>('android');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastSyncTimestampRef = useRef<number>(0);

  // Check if user already has verified/saved location on profile
  useEffect(() => {
    if (user?.liveLocation?.latitude && user?.liveLocation?.longitude) {
      setCurrentCoords({
        lat: user.liveLocation.latitude,
        lng: user.liveLocation.longitude,
        accuracy: user.liveLocation.accuracy || 250
      });
      setLocationStatus('granted');
    }
  }, [user?.liveLocation?.latitude, user?.liveLocation?.longitude]);

  // Auto-detect Android vs iOS on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/i.test(ua)) {
        setPhoneOsTab('ios');
      } else {
        setPhoneOsTab('android');
      }
    }
  }, []);

  const syncLocationToFirebase = useCallback(async (lat: number, lng: number, accuracy?: number, force = false) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    const now = Date.now();
    // Protect against quota exhaustion: maximum 1 write every 30 minutes unless forced by explicit button click
    if (!force && now - lastSyncTimestampRef.current < 1800000) {
      return;
    }
    lastSyncTimestampRef.current = now;

    const locationData = {
      latitude: lat,
      longitude: lng,
      accuracy: accuracy || 0,
      timestamp: now,
      active: true
    };

    // Always update local store immediately for instant UI responsiveness
    setUser({
      ...currentUser,
      liveLocation: locationData
    });
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        liveLocation: locationData
      });
    } catch (err: any) {
      // Gracefully handle Firestore quota exceeded without breaking UI
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        console.warn('Firestore daily write quota reached. Live location maintained in active session memory.');
      } else {
        console.warn('Notice syncing live location:', err?.message || err);
      }
    }
  }, [setUser]);

  // Fallback to user registered state coordinates
  const useRegisteredStateLocation = useCallback(() => {
    const currentUser = useAuthStore.getState().user;
    const userState = currentUser?.state || 'Lagos';
    const coords = getStateCoordinates(userState);
    setCurrentCoords({ lat: coords.lat, lng: coords.lng, accuracy: 250 });
    setLocationStatus('granted');
    setShowLocationModal(false);
    syncLocationToFirebase(coords.lat, coords.lng, 250, true);
  }, [syncLocationToFirebase]);

  const requestAndTrackLocation = useCallback((isUserClick = false) => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      if (isUserClick) setShowLocationModal(true);
      return;
    }

    setIsUpdating(true);
    setDenialReason(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy });
        setLocationStatus('granted');
        setIsUpdating(false);
        setShowLocationModal(false);
        syncLocationToFirebase(latitude, longitude, accuracy, isUserClick);
      },
      (error) => {
        console.warn('Geolocation access status:', error.message);
        setLocationStatus('denied');
        setIsUpdating(false);

        if (error.code === 1) {
          setDenialReason("Browser location permission was blocked. Please follow the steps below or use your registered state location.");
        } else if (error.code === 2) {
          setDenialReason("Your phone's GPS / Location is switched OFF in phone system settings. Please toggle it ON.");
        } else {
          setDenialReason("Location detection timed out. Please ensure GPS is active on your device.");
        }

        if (isUserClick) {
          setShowLocationModal(true);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  }, [syncLocationToFirebase]);

  // Check once on initial mount if not already granted
  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.liveLocation?.latitude && currentUser?.liveLocation?.longitude) {
      setLocationStatus('granted');
      return;
    }
    // Only check passively once on mount without spamming
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') {
            requestAndTrackLocation(false);
          } else if (res.state === 'denied') {
            setLocationStatus('denied');
          }
        })
        .catch(() => {
          // Permissions API not supported or restricted, leave as prompt
        });
    }
  }, [requestAndTrackLocation]);

  return (
    <>
      {/* 1. Security Warning Banner if Location is NOT granted */}
      {locationStatus !== 'granted' && !isDismissed && (
        <div 
          id="security-location-warning-banner"
          className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-medium z-40 relative"
        >
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold">Security Requirement: Live Location Required</span>
              <p className="text-[11px] text-amber-100 hidden sm:block">
                To safeguard both artisans and customers during home visits and service calls, active location is required for emergency traceability.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => requestAndTrackLocation(true)}
              disabled={isUpdating}
              className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-3 py-1.5 h-auto rounded-lg shadow-sm border border-amber-200"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Acquiring GPS...
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 text-amber-700 mr-1.5" />
                  Enable Live GPS
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={useRegisteredStateLocation}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-2.5 py-1.5 h-auto rounded-lg border border-amber-400/50"
            >
              Use {user?.state || 'Lagos'} Pin
            </Button>

            <button
              onClick={() => setShowLocationModal(true)}
              className="text-amber-100 hover:text-white underline text-xs px-1"
            >
              Guide
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-amber-200 hover:text-white p-1 rounded-md"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Security Badge indicator when active */}
      {locationStatus === 'granted' && currentCoords && (
        <div className="hidden lg:flex fixed top-20 right-4 z-30 bg-emerald-950/90 text-emerald-100 border border-emerald-500/30 rounded-full px-3 py-1 shadow-lg items-center gap-2 text-[11px] backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Security Location: <strong>Active</strong></span>
          <span className="text-emerald-400/80 font-mono text-[10px]">
            {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
          </span>
          {lastSyncTime && (
            <span className="text-emerald-300/60 text-[10px] hidden xl:inline">
              ({lastSyncTime})
            </span>
          )}
        </div>
      )}

      {/* 3. Interactive Phone Location Toggle & Guidance Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Turn On Location On Your Phone</h3>
                  <p className="text-xs text-emerald-100">Quick 1-minute steps to enable GPS for 9jaKonet</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {denialReason && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Status:</span> {denialReason}
                  </div>
                </div>
              )}

              {/* OS Tabs: Android vs iPhone */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setPhoneOsTab('android')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
                    phoneOsTab === 'android'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📱 Android Phone (Samsung, Tecno, etc.)
                </button>
                <button
                  onClick={() => setPhoneOsTab('ios')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
                    phoneOsTab === 'ios'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🍎 iPhone (Apple Safari)
                </button>
              </div>

              {/* Step instructions */}
              {phoneOsTab === 'android' ? (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Swipe Down Quick Settings:</strong>
                      <span>Swipe down from the very top of your phone screen to open your quick toggle menu.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Turn ON Location (GPS):</strong>
                      <span>Tap the <strong>Location / GPS (📍)</strong> icon so it highlights (turns blue/active).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Allow in Chrome / Browser:</strong>
                      <span>Tap the <strong>Lock (🔒) or Settings icon</strong> in your browser address bar beside the website URL ➜ Tap <strong>Permissions / Site Settings</strong> ➜ Tap <strong>Location</strong> ➜ Select <strong>Allow</strong>.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Turn on iPhone Location Services:</strong>
                      <span>Open iPhone <strong>Settings</strong> ➜ Scroll down to <strong>Privacy & Security</strong> ➜ Tap <strong>Location Services</strong> ➜ Switch to <strong>ON</strong>.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Allow in Safari:</strong>
                      <span>In Safari, tap the <strong>aA</strong> icon on the left of your address bar ➜ Tap <strong>Website Settings</strong> ➜ Tap <strong>Location</strong> ➜ Choose <strong>Allow</strong>.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>Why this is required on 9jaKonet</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Active location provides emergency safety traceability for clients and artisans whenever dispatching to physical home or office addresses. Your location is encrypted and secure.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Button 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setShowLocationModal(false)}
                >
                  Dismiss
                </Button>

                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  onClick={useRegisteredStateLocation}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Use {user?.state || 'Lagos'} Pin
                </Button>

                <Button 
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex-1 text-xs shadow-md"
                  onClick={() => requestAndTrackLocation(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Checking Phone GPS...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Check Phone GPS Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

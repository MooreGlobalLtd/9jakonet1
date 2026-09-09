import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MapPin, AlertTriangle, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

export default function LiveLocationWatcher() {
  const { user, setUser } = useAuthStore();
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const syncLocationToFirebase = useCallback(async (lat: number, lng: number, accuracy?: number) => {
    if (!user) return;
    try {
      const now = Date.now();
      const locationData = {
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || 0,
        timestamp: now,
        active: true
      };

      await updateDoc(doc(db, 'users', user.id), {
        liveLocation: locationData
      });

      setUser({
        ...user,
        liveLocation: locationData
      });

      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Failed to sync live location to database:', err);
    }
  }, [user, setUser]);

  const requestAndTrackLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    setIsUpdating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy });
        setLocationStatus('granted');
        setIsUpdating(false);
        syncLocationToFirebase(latitude, longitude, accuracy);
      },
      (error) => {
        console.warn('Geolocation access error:', error.message);
        setLocationStatus('denied');
        setIsUpdating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  }, [syncLocationToFirebase]);

  // Initial trigger and continuous watch
  useEffect(() => {
    requestAndTrackLocation();

    // Setup continuous watcher
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCurrentCoords({ lat: latitude, lng: longitude, accuracy });
          setLocationStatus('granted');
          syncLocationToFirebase(latitude, longitude, accuracy);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus('denied');
          }
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [requestAndTrackLocation, syncLocationToFirebase]);

  // Periodically refresh position every 3 minutes while on web app
  useEffect(() => {
    const interval = setInterval(() => {
      if (locationStatus === 'granted') {
        requestAndTrackLocation();
      }
    }, 180000);
    return () => clearInterval(interval);
  }, [locationStatus, requestAndTrackLocation]);

  return (
    <>
      {/* 1. Security Warning Banner if Location is NOT granted */}
      {locationStatus !== 'granted' && (
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
                To safeguard both artisans and customers during home visits and service calls, active live GPS is mandatory for emergency traceabilty.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={requestAndTrackLocation}
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
                  Enable Live Location
                </>
              )}
            </Button>
            <button
              onClick={() => setShowLocationModal(true)}
              className="text-amber-100 hover:text-white underline text-xs"
            >
              Why this is required?
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

      {/* 3. Explainer Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Why Live Location is Required</h3>
                <p className="text-xs text-slate-500">Safety & Security Verification on 9jaKonet</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p>
                <strong>Customer & Artisan Protection:</strong> Whenever an artisan is dispatched to a customer's residence or workplace, safety is 9jaKonet's highest priority.
              </p>
              <p>
                By keeping live location enabled:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Both parties are verified to be at the authorized job location.</li>
                <li>In the event of an emergency, dispute, or incident, our administration can trace exact timestamps and coordinates.</li>
                <li>Your data is encrypted and strictly used for service verification and user protection.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLocationModal(false)}
              >
                Close
              </Button>
              <Button 
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => {
                  setShowLocationModal(false);
                  requestAndTrackLocation();
                }}
              >
                Allow & Enable Location
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

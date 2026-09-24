import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArtisanProfile, User } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Search, MapPin, Star, ShieldCheck, MessageCircle, Navigation, Loader2, X, CheckCircle2, Phone, BadgeCheck, Briefcase, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';
import { sendInAppNotification } from '../lib/notifications';

interface DetectedLocationInfo {
  fullAddress: string;
  landmark: string;
  houseNumber: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Abuja',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

function normalizeNigerianState(raw: string): string {
  if (!raw) return '';
  const s = raw.toLowerCase().replace(/\s+state$/i, '').trim();
  if (s.includes('abuja') || s.includes('federal capital') || s === 'fct') {
    return 'Abuja';
  }
  for (const st of NIGERIAN_STATES) {
    if (st.toLowerCase() === s || s.includes(st.toLowerCase())) {
      return st;
    }
  }
  return raw.replace(/\s+State$/i, '').trim();
}

// High-resolution reverse geocode for exact standing spot, building number, and street address
async function reverseGeocodeExactAddress(latitude: number, longitude: number): Promise<DetectedLocationInfo> {
  let arcAddress: any = null;
  let osmAddress: any = null;

  // Query ArcGIS and OpenStreetMap concurrently to extract exact building name, house number, and street
  await Promise.allSettled([
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(
          `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${longitude},${latitude}&outSR=4326&f=json`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          arcAddress = data?.address || null;
        }
      } catch (e) {
        console.warn('ArcGIS reverse geocode error:', e);
      }
    })(),
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { signal: controller.signal, headers: { 'User-Agent': '9jaKonet-App/1.0' } }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          osmAddress = data?.address || null;
        }
      } catch (e) {
        console.warn('OSM Nominatim reverse geocode error:', e);
      }
    })()
  ]);

  const a = arcAddress || {};
  const o = osmAddress || {};

  const houseNumber = (a.AddNum || o.house_number || '').trim();
  const rawStreet = (a.Address || o.road || o.pedestrian || o.footway || '').trim();
  const landmark = (a.PlaceName || o.amenity || o.building || o.shop || o.office || o.tourism || '').trim();
  const neighborhood = (a.Neighborhood || o.neighbourhood || o.suburb || o.residential || o.estate || '').trim();
  const city = (a.City || o.city || o.town || o.village || a.District || '').trim();
  const rawState = (a.Region || o.state || '').replace(/\s+State$/i, '').trim();
  const state = normalizeNigerianState(rawState || 'Lagos');

  let streetPart = '';
  if (houseNumber && rawStreet) {
    streetPart = `${houseNumber} ${rawStreet}`;
  } else if (rawStreet) {
    streetPart = rawStreet;
  } else if (houseNumber) {
    streetPart = `No. ${houseNumber}`;
  }

  const parts: string[] = [];
  if (landmark && landmark !== rawStreet && landmark !== city && landmark !== state) {
    parts.push(landmark);
  }
  if (streetPart && !parts.includes(streetPart)) {
    parts.push(streetPart);
  }
  if (neighborhood && !parts.includes(neighborhood) && neighborhood !== city && neighborhood !== landmark) {
    parts.push(neighborhood);
  }
  if (city && !parts.includes(city) && city !== state) {
    parts.push(city);
  }
  if (state && !parts.includes(state)) {
    parts.push(state);
  }

  let fullAddress = parts.join(', ');
  if (!fullAddress && a.LongLabel) {
    fullAddress = String(a.LongLabel).replace(/,\s*(NGA|Nigeria)$/i, '').trim();
  }
  if (!fullAddress && o.display_name) {
    fullAddress = String(o.display_name).replace(/,\s*Nigeria$/i, '').trim();
  }
  if (!fullAddress) {
    fullAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  return {
    fullAddress,
    landmark,
    houseNumber,
    street: streetPart || rawStreet,
    neighborhood,
    city,
    state,
    latitude,
    longitude
  };
}

function isArtisanInState(artisan: any, targetState: string): boolean {
  if (!artisan || !targetState) return false;
  const normTarget = normalizeNigerianState(targetState).toLowerCase();

  const userState = normalizeNigerianState(artisan.user?.state || '').toLowerCase();
  const artState = normalizeNigerianState(artisan.state || '').toLowerCase();

  if (userState && (userState === normTarget || userState.includes(normTarget) || normTarget.includes(userState))) {
    return true;
  }
  if (artState && (artState === normTarget || artState.includes(normTarget) || normTarget.includes(artState))) {
    return true;
  }

  const areas = Array.isArray(artisan.serviceAreas)
    ? artisan.serviceAreas.map((a: any) => (typeof a === 'string' ? a.toLowerCase() : ''))
    : [];

  if (areas.some(area => area.includes(normTarget) || normTarget.includes(area))) {
    return true;
  }

  const city = (artisan.city || '').toLowerCase();
  const address = (artisan.address || artisan.user?.address || '').toLowerCase();

  if (city.includes(normTarget) || address.includes(normTarget)) {
    return true;
  }

  // Major state hub heuristics
  if (normTarget === 'lagos') {
    const lagosHubs = ['ikeja', 'lekki', 'yaba', 'surulere', 'ikoyi', 'victoria island', 'vi', 'ikorodu', 'alimosho', 'festac', 'maryland', 'gbagada', 'agege', 'oshodi', 'isolo', 'ajah', 'epe', 'badagry', 'ojota', 'alausa', 'mushin', 'shomolu', 'apapa'];
    if (lagosHubs.some(hub => city.includes(hub) || address.includes(hub) || areas.some(a => a.includes(hub)))) {
      return true;
    }
  }

  if (normTarget === 'abuja') {
    const abujaHubs = ['wuse', 'garki', 'maitama', 'asokoro', 'gwarinpa', 'jabi', 'kubwa', 'lugbe', 'apo', 'utako', 'fct'];
    if (abujaHubs.some(hub => city.includes(hub) || address.includes(hub) || areas.some(a => a.includes(hub)))) {
      return true;
    }
  }

  if (normTarget === 'oyo') {
    const oyoHubs = ['ibadan', 'ogbomoso', 'iseyin', 'bodija', 'dugbe', 'iwo road'];
    if (oyoHubs.some(hub => city.includes(hub) || address.includes(hub) || areas.some(a => a.includes(hub)))) {
      return true;
    }
  }

  if (normTarget === 'rivers') {
    const riversHubs = ['port harcourt', 'obio-akpor', 'diobu', 'trans amadi', 'rumuokoro'];
    if (riversHubs.some(hub => city.includes(hub) || address.includes(hub) || areas.some(a => a.includes(hub)))) {
      return true;
    }
  }

  return false;
}

export default function Explore() {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlLocation = searchParams.get('location') || '';

  const [allArtisans, setAllArtisans] = useState<(ArtisanProfile & { user: User; _proximityBadge?: string; _proximityNote?: string })[]>([]);
  const [artisans, setArtisans] = useState<(ArtisanProfile & { user: User; _proximityBadge?: string; _proximityNote?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlCategory || urlSearch);
  const [locationQuery, setLocationQuery] = useState(urlLocation);
  const [detectedInfo, setDetectedInfo] = useState<DetectedLocationInfo | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<(ArtisanProfile & { user: User }) | null>(null);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Sync with URL query parameters when they change
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const s = searchParams.get('search') || '';
    const loc = searchParams.get('location') || '';
    if (cat || s) {
      setSearchQuery(cat || s);
    }
    if (loc) {
      setLocationQuery(loc);
    }
  }, [searchParams]);

  
  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    
    const handleSuccess = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords;
        const locInfo = await reverseGeocodeExactAddress(latitude, longitude);
        if (locInfo && locInfo.fullAddress) {
          setDetectedInfo(locInfo);
          setLocationQuery(locInfo.fullAddress);
          toast.success(`Exact spot detected: ${locInfo.fullAddress}`);
        } else {
          toast.error("Could not determine your exact address. Please type it manually.");
        }
      } catch (err) {
        console.error("Error resolving detected location:", err);
        toast.error("Failed to resolve exact address. Please type it manually.");
      } finally {
        setIsLocating(false);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      // If high accuracy GPS timed out, fallback to low-accuracy / cell tower / Wi-Fi
      if (error.code === error.TIMEOUT) {
        try {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            () => {
              setIsLocating(false);
              toast.error("Location request timed out. Please type your address or area manually.");
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
          return;
        } catch (e) {
          // Continue to generic error below
        }
      }

      setIsLocating(false);
      if (error.code === 1) {
        toast.error("Location permission denied. Please enable location in your browser or type your address.");
      } else if (error.code === 2) {
        toast.error("Location unavailable. Please check your device GPS or type your address.");
      } else if (error.code === 3) {
        toast.error("Location request timed out. Please type your address manually.");
      } else {
        toast.error("Failed to detect location. Please type your address manually.");
      }
    };

    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } catch (err) {
      setIsLocating(false);
      console.error("Geolocation error:", err);
      toast.error("Failed to start location detection. Please type your address manually.");
    }
  };


  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const artisanSnap = await getDocs(collection(db, 'artisans'));
        const userSnap = await getDocs(collection(db, 'users'));
        
        const usersMap = new Map();
        userSnap.docs.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() }));

        const artisanDocs = artisanSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const synthesizedArtisans: any[] = [];

        // 1. Process all explicitly created artisan profiles
        artisanDocs.forEach(profile => {
          const user = usersMap.get(profile.userId || profile.id);
          if (user) {
            const rawAreas = profile.serviceAreas;
            const cleanAreas: string[] = Array.isArray(rawAreas)
              ? rawAreas.filter(a => typeof a === 'string' && a.trim().length > 0).map(a => a.trim())
              : (typeof rawAreas === 'string' && rawAreas.trim().length > 0 ? [rawAreas.trim()] : [profile.city || profile.state || user.state || 'Lagos'].filter(Boolean));

            synthesizedArtisans.push({
              ...profile,
              userId: profile.userId || profile.id,
              tradeCategory: profile.tradeCategory || 'Professional Artisan',
              yearsExp: Number(profile.yearsExp) || 0,
              ratingAvg: Number(profile.ratingAvg ?? profile.rating) || 5.0,
              reviewsCount: Number(profile.reviewsCount ?? profile.completedJobsCount) || 0,
              totalJobsDone: Number(profile.totalJobsDone ?? profile.completedJobsCount) || 0,
              serviceAreas: cleanAreas.length > 0 ? cleanAreas : [user.state || 'Lagos'],
              verificationStatus: (user.isKycVerified || user.kyc?.status === 'verified' || profile.verificationStatus === 'verified') ? 'verified' : (profile.verificationStatus || 'pending'),
              user
            });
            // Mark this user as processed
            user._artisanProcessed = true;
          }
        });

        // 2. Process any users who signed up as 'artisan' but haven't created a profile document yet
        usersMap.forEach((user, userId) => {
          if (user.role === 'artisan' && !user._artisanProcessed) {
            synthesizedArtisans.push({
              id: userId,
              userId: userId,
              tradeCategory: 'Professional Artisan',
              yearsExp: 0,
              ratingAvg: 5.0,
              reviewsCount: 0,
              totalJobsDone: 0,
              serviceAreas: [user.state || 'Lagos'].filter(Boolean),
              verificationStatus: user.isKycVerified || user.kyc?.status === 'verified' ? 'verified' : 'pending',
              user: user
            });
          }
        });

        const verifiedArtisans = synthesizedArtisans.filter(a => {
          if (!a || !a.user) return false;
          return a.verificationStatus === 'verified' || a.user.isKycVerified || a.user.kyc?.status === 'verified';
        });

        setAllArtisans(verifiedArtisans);
        setArtisans(verifiedArtisans);
      } catch (error) {
        console.error("Error fetching artisans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  // Proximity Ranking and Filter effect
  useEffect(() => {
    let pool = allArtisans;
    
    // 1. Trade Category or Text Search Filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      pool = pool.filter(a => {
        if (!a) return false;
        const trade = (a.tradeCategory || '').toLowerCase();
        const name = (a.user?.displayName || '').toLowerCase();
        const bio = (a.bio || '').toLowerCase();
        return trade.includes(q) || name.includes(q) || bio.includes(q);
      });
    }
    
    // 2. Strict State-Only Filtering & Proximity Ranking
    if (locationQuery && locationQuery.trim()) {
      const locQ = locationQuery.trim().toLowerCase();

      // Determine target state
      let targetState = '';
      if (detectedInfo && (locationQuery === detectedInfo.fullAddress || locationQuery.includes(detectedInfo.state))) {
        targetState = detectedInfo.state;
      } else {
        // Find state mentioned in query
        for (const st of NIGERIAN_STATES) {
          if (locQ.includes(st.toLowerCase())) {
            targetState = st;
            break;
          }
        }
        if (!targetState) {
          const words = locQ.split(/[,\s/-]+/).map(w => w.trim()).filter(Boolean);
          if (words.length > 0) {
            targetState = words[words.length - 1];
          }
        }
      }

      // Local spot keywords for ranking closest artisans
      let localWords: string[] = [];
      if (detectedInfo) {
        const rawLocal = [
          detectedInfo.landmark,
          detectedInfo.houseNumber,
          detectedInfo.street,
          detectedInfo.neighborhood,
          detectedInfo.city
        ].filter(Boolean);

        localWords = rawLocal
          .flatMap(s => s.toLowerCase().split(/[,\s/-]+/))
          .map(w => w.trim())
          .filter(w => w.length > 2 && !['state', 'nigeria', 'street', 'str', 'road', 'rd', 'close', 'cls', 'avenue', 'ave', 'lane', 'ln', 'way'].includes(w));
      } else {
        localWords = locQ
          .split(/[,\s/-]+/)
          .map(w => w.trim())
          .filter(w => w.length > 2 && !['state', 'nigeria', 'street', 'str', 'road', 'rd', 'close', 'cls', 'avenue', 'ave', 'lane', 'ln', 'way'].includes(w));
      }

      // STRICT STATE FILTERING:
      // When a state is detected (e.g. Lagos), ONLY include artisans in that state!
      // Artisans from other states are NOT shown!
      const inStatePool = targetState 
        ? pool.filter(a => isArtisanInState(a, targetState))
        : pool;

      // Score in-state artisans by closeness to standing spot:
      const scored = inStatePool.map(a => {
        const aCity = (a.city || '').toLowerCase();
        const aAddress = (a.address || a.user?.address || '').toLowerCase();
        const aAreas = Array.isArray(a.serviceAreas)
          ? a.serviceAreas.map(area => (typeof area === 'string' ? area.toLowerCase() : ''))
          : [];

        // Check local spot / neighborhood / city match (Score 2: Closest)
        const isClosestMatch = localWords.some(word => 
          aAreas.some(area => area && (area.includes(word) || word.includes(area))) ||
          (aCity && (aCity.includes(word) || word.includes(aCity))) ||
          (aAddress && aAddress.includes(word))
        );

        if (isClosestMatch) {
          const matchedArea = aAreas.find(area => localWords.some(w => area.includes(w))) || aCity || (localWords[0] ? localWords[0].charAt(0).toUpperCase() + localWords[0].slice(1) : 'your area');
          return {
            artisan: a,
            score: 2,
            badge: 'closest',
            note: `Closest to you (${matchedArea})`
          };
        }

        // In same state (Score 1)
        return {
          artisan: a,
          score: 1,
          badge: 'state',
          note: `In ${targetState || 'your state'}`
        };
      });

      // Sort with closest at the top!
      const sortedList = scored
        .sort((x, y) => y.score - x.score)
        .map(item => ({
          ...item.artisan,
          _proximityBadge: item.badge,
          _proximityNote: item.note
        }));

      setArtisans(sortedList);
    } else {
      setArtisans(pool.map(a => ({ ...a, _proximityBadge: undefined, _proximityNote: undefined })));
    }
  }, [searchQuery, locationQuery, allArtisans, detectedInfo]);

  
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} 
          />
        ))}
      </div>
    );
  };

  const visitedArtisansRef = useRef<Set<string>>(new Set());

  const handleViewProfile = (artisan: ArtisanProfile & { user: User }) => {
    setSelectedArtisan(artisan);
    const targetUserId = artisan.userId || artisan.user?.id;
    // Only dispatch visitor notification to the artisan being viewed (never to the viewer)
    if (targetUserId && (!user || user.id !== targetUserId)) {
      if (!visitedArtisansRef.current.has(targetUserId)) {
        visitedArtisansRef.current.add(targetUserId);
        sendInAppNotification({
          userId: targetUserId,
          title: '👀 Profile Visitor Alert!',
          body: user?.displayName 
            ? `${user.displayName} is viewing your verified profile on 9jaKonet.`
            : `A customer looking for ${artisan.tradeCategory || 'services'} is viewing your profile.`,
          link: '/dashboard',
          type: 'general'
        });
      }
    }
  };

  const handleMessageArtisan = async (artisanId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!user.isKycVerified) {
      alert("You must complete identity verification (KYC) before you can contact and hire artisans.");
      return;
    }
    
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.id));
    const snap = await getDocs(q);
    
    let existingChatId = null;
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(artisanId)) {
        existingChatId = doc.id;
      }
    });

    if (existingChatId) {
      navigate(`/messages?chat=${existingChatId}`);
    } else {
      if (isQuotaExhausted()) {
        alert("System quota limit reached for today. New conversations cannot be started right now. Try again later.");
        return;
      }
      try {
        // Create new chat
        const newChat = await addDoc(chatsRef, {
          participants: [user.id, artisanId],
          updatedAt: Date.now(),
        });
        navigate(`/messages?chat=${newChat.id}`);
      } catch (err: any) {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('quota')) {
          markQuotaExhausted();
          alert("System quota limit reached for today. New conversations cannot be started right now. Try again later.");
        } else {
          alert("Failed to start conversation.");
          console.error(err);
        }
      }
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Artisans</h1>
          <p className="text-slate-500">Find the perfect professional for your job.</p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              placeholder="Search by trade (e.g. Barber, Electrician)..." 
              className="w-full sm:w-64" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Where? (State, City, or Friend's Area)..." 
                className="pl-9 pr-8 w-full" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
              {locationQuery && (
                <button
                  type="button"
                  onClick={() => setLocationQuery('')}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  title="Clear location filter"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={handleDetectLocation} 
              disabled={isLocating}
              className="w-10 px-0 shrink-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white"
              title="Detect My Location (GPS)"
            >
              {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
            </Button>
            </div>
          </div>
          
          {/* Quick Filter Categories */}
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            {['Electrician', 'Plumber', 'Mechanic', 'Painter', 'AC Technician', 'Carpenter', 'Tailor', 'Cleaner', 'Driver'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSearchQuery(cat)}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                  searchQuery.toLowerCase() === cat.toLowerCase() 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {cat}
              </button>
            ))}
            {(searchQuery || locationQuery) && (
              <button 
                onClick={() => { setSearchQuery(''); setLocationQuery(''); }}
                className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
              >
                Reset All
              </button>
            )}
          </div>
          {locationQuery && (
            <div className="flex items-center gap-1.5 self-start text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-md">Filtering near: <strong>{locationQuery}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setLocationQuery('');
                  setDetectedInfo(null);
                }}
                className="ml-1 text-emerald-600 hover:text-red-600"
                title="Remove location filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exact Detected Location Banner */}
      {detectedInfo && locationQuery === detectedInfo.fullAddress && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 sm:mt-0 shadow-xs">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">
                  Exact Detected Location
                </span>
                {detectedInfo.landmark && (
                  <span className="text-xs font-semibold text-emerald-800">
                    📍 {detectedInfo.landmark}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-snug">
                {detectedInfo.fullAddress}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Showing verified professionals in <strong>{detectedInfo.state || 'your state'}</strong> only (closest to your spot first).
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocationQuery('');
              setDetectedInfo(null);
            }}
            className="text-xs h-8 border-emerald-300 text-emerald-800 hover:bg-emerald-100 self-start sm:self-auto shrink-0 bg-white"
          >
            Clear GPS Spot
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Finding verified professionals near you...</p>
        </div>
      ) : artisans.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/80 rounded-2xl border border-slate-200 mt-4 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {detectedInfo?.state 
              ? `No verified artisans registered in ${detectedInfo.state} yet` 
              : (locationQuery ? `No verified artisans found in "${locationQuery}"` : 'No artisans match your search')}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-6 max-w-md mx-auto">
            {detectedInfo?.state 
              ? `We detected your exact location in ${detectedInfo.state}. There are no verified professionals registered in ${detectedInfo.state} yet, but we have ${allArtisans.length} verified artisans across Nigeria ready to work.` 
              : "Try adjusting your trade category or search keywords."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {locationQuery && (
              <Button 
                onClick={() => {
                  setLocationQuery('');
                  setDetectedInfo(null);
                }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm"
              >
                Show All Available Artisans Nationwide ({allArtisans.length})
              </Button>
            )}
            {(searchQuery || locationQuery) && (
              <Button 
                variant="outline"
                onClick={() => { 
                  setSearchQuery(''); 
                  setLocationQuery(''); 
                  setDetectedInfo(null);
                }} 
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artisans.map((artisan, index) => {
            const artisanKey = artisan.userId || artisan.id || `artisan-${index}`;
            const primaryArea = (artisan.serviceAreas && artisan.serviceAreas[0]) || artisan.user?.state || artisan.state || 'Anywhere';
            return (
              <Card key={artisanKey} className="overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <img 
                        src={artisan.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.user?.displayName || 'Artisan')}`} 
                        alt={artisan.user?.displayName || 'Artisan'} 
                        className="h-16 w-16 rounded-full object-cover shadow-sm border border-slate-100" 
                      />
                      {artisan._proximityBadge === 'closest' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                          <Navigation className="w-3 h-3 text-emerald-700" />
                          Closest
                        </span>
                      )}
                      {artisan._proximityBadge === 'state' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {artisan._proximityNote || 'In your state'}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-lg text-slate-900">{artisan.user?.displayName || 'Verified Artisan'}</h3>
                      {(artisan.verificationStatus === 'verified' || artisan.user?.isKycVerified || artisan.user?.kyc?.status === 'verified') && (
                        <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" title="KYC Verified" />
                      )}
                      {artisan.isPremium && (
                        <span className="flex items-center justify-center h-5 w-5 bg-amber-100 rounded-full shrink-0" title="9jaKonet Pro">
                          <span className="text-amber-600 text-[10px]">👑</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-emerald-600">{artisan.tradeCategory || 'Service Provider'}</p>
                    
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center">
                        {renderStars(artisan.ratingAvg > 0 ? artisan.ratingAvg : 5)}
                        <span className="ml-2 font-medium">{artisan.ratingAvg > 0 ? artisan.ratingAvg.toFixed(1) : '5.0'}</span>
                        <span className="ml-1 text-slate-500">({artisan.totalJobsDone || 0} jobs)</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{primaryArea}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50 p-4 flex gap-2">
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => handleViewProfile(artisan)}>View Profile</Button>
                    <Button variant="outline" className="px-3 border-slate-200 hover:bg-slate-100 text-slate-700" onClick={() => handleMessageArtisan(artisan.userId || artisan.id)}>
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Artisan Profile Modal */}
      {selectedArtisan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Artisan Profile</h2>
              <button 
                onClick={() => setSelectedArtisan(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-start gap-5">
                <img 
                  src={selectedArtisan.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedArtisan.user?.displayName || 'A')}`} 
                  alt={selectedArtisan.user?.displayName} 
                  className="h-24 w-24 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-slate-100" 
                />
                <div className="pt-2">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedArtisan.user?.displayName}</h2>
                    {(selectedArtisan.verificationStatus === 'verified' || selectedArtisan.user?.isKycVerified || selectedArtisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" title="KYC Verified" />
                    )}
                    {selectedArtisan.isPremium && (
                      <span className="flex items-center justify-center h-6 w-6 bg-amber-100 rounded-full shrink-0" title="9jaKonet Pro">
                        <span className="text-amber-600 text-sm">👑</span>
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-600 font-medium text-sm mt-0.5">{selectedArtisan.tradeCategory}</p>
                  <div className="flex items-center mt-2 text-slate-600 text-sm">
                    {renderStars(selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg : 5)}
                    <span className="font-bold text-slate-900 ml-2 mr-1">{selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-500">({selectedArtisan.totalJobsDone > 0 ? selectedArtisan.totalJobsDone : 0} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  About Me
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedArtisan.bio || "This professional hasn't written a bio yet, but they are ready for work!"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedArtisan.yearsExp || 0} Years</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</p>
                  <p className="font-bold text-slate-900 mt-0.5 w-full truncate px-2" title={(selectedArtisan.serviceAreas && selectedArtisan.serviceAreas[0]) || selectedArtisan.user?.state || 'Anywhere'}>
                    {(selectedArtisan.serviceAreas && selectedArtisan.serviceAreas[0]) || selectedArtisan.user?.state || 'Anywhere'}
                  </p>
                </div>
              </div>

              {selectedArtisan.portfolioImages && selectedArtisan.portfolioImages.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    Portfolio Gallery
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedArtisan.portfolioImages.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                        <img src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold shadow-md"
                onClick={() => {
                  handleMessageArtisan(selectedArtisan.userId || selectedArtisan.id);
                  setSelectedArtisan(null);
                }}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Message {selectedArtisan.user?.displayName?.split(' ')[0] || 'Artisan'} Now
              </Button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

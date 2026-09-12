import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArtisanProfile, User } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Search, MapPin, Star, ShieldCheck, MessageCircle, Navigation, Loader2, X, CheckCircle2, Phone, BadgeCheck, Briefcase, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

export default function Explore() {
  const [allArtisans, setAllArtisans] = useState<(ArtisanProfile & { user: User })[]>([]);
  const [artisans, setArtisans] = useState<(ArtisanProfile & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<(ArtisanProfile & { user: User }) | null>(null);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setIsLocating(false);
          let detectedLocation = '';
          const googleMapsApiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
          
          if (googleMapsApiKey) {
            try {
              // Use Google Maps Geocoding API for exact street level accuracy
              const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`);
              const data = await res.json();
              
              if (data.results && data.results.length > 0) {
                detectedLocation = data.results[0].formatted_address;
                detectedLocation = detectedLocation.replace(', Nigeria', '');
              } else {
                console.warn("Google Maps Geocoding failed or returned no results:", data);
              }
            } catch (err) {
              console.error("Google Maps API error:", err);
            }
          } 
          
          if (!detectedLocation) {
            try {
              // Fallback to ArcGIS Geocoding if API key is not set OR if Google Maps failed (e.g., billing not enabled)
              const res = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${longitude},${latitude}&outSR=4326&f=json`);
              const data = await res.json();
              
              if (data && data.address) {
                const addr = data.address;
                const parts = [];
                
                if (addr.PlaceName) parts.push(addr.PlaceName);
                else if (addr.Address) parts.push(addr.Address);
                
                if (addr.Neighborhood) parts.push(addr.Neighborhood);
                else if (addr.City) parts.push(addr.City);
                
                if (addr.Region) parts.push(addr.Region);
                
                detectedLocation = [...new Set(parts.filter(Boolean))].join(', ');
              }
            } catch (err) {
              console.error("ArcGIS Geocoding error:", err);
            }
          }
          
          if (detectedLocation) {
             setLocationQuery(detectedLocation);
             toast.success(`Location detected: ${detectedLocation}`);
          } else {
             toast.error("Could not automatically determine your specific location.");
          }
        } catch(err) {
          setIsLocating(false);
          toast.error("Network error detecting location.");
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          toast.error("Location permission denied. Please allow it in browser settings.");
        } else if (error.code === 2) {
          toast.error("Location unavailable. Please check your device GPS.");
        } else if (error.code === 3) {
          toast.error("Location request timed out. Please type it manually.");
        } else {
          toast.error("Failed to detect location. Please type it manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };


  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const artisanSnap = await getDocs(collection(db, 'artisans'));
        const userSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'artisan')));
        
        const usersMap = new Map();
        userSnap.docs.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() }));

        const artisanList = artisanSnap.docs.map(doc => {
          const profile = doc.data() as ArtisanProfile;
          const user = usersMap.get(profile.userId || doc.id);
          return { ...profile, userId: profile.userId || doc.id, user };
        }).filter(a => a.user && a.user.isKycVerified === true); // Only show if user exists AND is KYC verified

        setAllArtisans(artisanList);
        setArtisans(artisanList);
      } catch (error) {
        console.error("Error fetching artisans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  // Filter effect
  useEffect(() => {
    let filtered = allArtisans;
    
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.tradeCategory.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (locationQuery) {
      const locQ = locationQuery.toLowerCase();
      const locWords = locQ.split(/[,\s]+/).filter(w => w.length > 2);
      
      filtered = filtered.filter(a => {
        const state = (a.user.state || "").toLowerCase();
        const areas = a.serviceAreas.map(area => area.toLowerCase());
        
        // 1. Two-way check (e.g., does "Ikeja" include "Ikeja, Lagos" or vice-versa)
        const hasDirectMatch = areas.some(area => area.includes(locQ) || locQ.includes(area)) || 
                               (state && (state.includes(locQ) || locQ.includes(state)));
                               
        if (hasDirectMatch) return true;
        
        // 2. Word-level check (if location is "Oladipupo Kuku St, Ikeja", match any artisan who serves "Ikeja")
        return locWords.some(word => 
           areas.some(area => area.includes(word)) || (state && state.includes(word))
        );
      });
    }
    
    setArtisans(filtered);
  }, [searchQuery, locationQuery, allArtisans]);

  
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

  const handleMessageArtisan = async (artisanId: string) => {
    if (!user) {
      navigate('/login');
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
                className="pl-9 w-full" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleDetectLocation} 
              disabled={isLocating}
              className="w-10 px-0 shrink-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white"
              title="Detect My Location"
            >
              {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
            </Button>
            </div>
          </div>
          
          {/* Quick Filter Categories */}
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            {['AC Technician', 'Tailor', 'Plumber', 'Electrician', 'Cleaner', 'Mechanic', 'Carpenter'].map(cat => (
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
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading artisans...</div>
      ) : artisans.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No artisans found in your area yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artisans.map((artisan) => (
            <Card key={artisan.userId} className="overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <img 
                      src={artisan.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.user?.displayName || 'A')}`} 
                      alt={artisan.user?.displayName} 
                      className="h-16 w-16 rounded-full object-cover shadow-sm border border-slate-100" 
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <h3 className="font-semibold text-lg text-slate-900">{artisan.user?.displayName}</h3>
                    {(artisan.verificationStatus === 'verified' || artisan.user?.isKycVerified || artisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" title="KYC Verified" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-emerald-600">{artisan.tradeCategory || 'Service Provider'}</p>
                  
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      {renderStars(artisan.ratingAvg > 0 ? artisan.ratingAvg : 5)}
                      <span className="ml-2 font-medium">{artisan.ratingAvg > 0 ? artisan.ratingAvg.toFixed(1) : 'New'}</span>
                      <span className="ml-1 text-slate-500">({artisan.totalJobsDone} jobs)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-slate-400" />
                      <span>{artisan.serviceAreas?.[0] || 'Anywhere'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 p-4 flex gap-2">
                  <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setSelectedArtisan(artisan)}>View Profile</Button>
                  <Button variant="outline" className="px-3 border-slate-200 hover:bg-slate-100 text-slate-700" onClick={() => handleMessageArtisan(artisan.userId)}>
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <p className="font-bold text-slate-900 mt-0.5 w-full truncate px-2" title={selectedArtisan.serviceAreas?.[0] || 'Anywhere'}>
                    {selectedArtisan.serviceAreas?.[0] || 'Anywhere'}
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
                  handleMessageArtisan(selectedArtisan.userId);
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

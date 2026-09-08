import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArtisanProfile, User } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Search, MapPin, Star, ShieldCheck, MessageCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const [allArtisans, setAllArtisans] = useState<(ArtisanProfile & { user: User })[]>([]);
  const [artisans, setArtisans] = useState<(ArtisanProfile & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

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
          const user = usersMap.get(profile.userId);
          return { ...profile, user };
        }).filter(a => a.user); // Only show if user data exists

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
      filtered = filtered.filter(a => 
        a.serviceAreas.some(area => area.toLowerCase().includes(locationQuery.toLowerCase())) ||
        (a.user.state && a.user.state.toLowerCase().includes(locationQuery.toLowerCase()))
      );
    }
    
    setArtisans(filtered);
  }, [searchQuery, locationQuery, allArtisans]);

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
      // Create new chat
      const newChat = await addDoc(chatsRef, {
        participants: [user.id, artisanId],
        updatedAt: Date.now(),
      });
      navigate(`/messages?chat=${newChat.id}`);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Artisans</h1>
          <p className="text-slate-500">Find the perfect professional for your job.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input 
            placeholder="Search by trade (e.g. Electrician)..." 
            className="w-full sm:w-64" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="relative w-full sm:w-64">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter by location (e.g. Lagos)..." 
              className="pl-9 w-full" 
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
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
                    {artisan.verificationStatus === 'verified' && (
                      <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-lg text-slate-900">{artisan.user?.displayName}</h3>
                  <p className="text-sm font-medium text-emerald-600">{artisan.tradeCategory || 'Service Provider'}</p>
                  
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Star className="mr-2 h-4 w-4 text-amber-400 fill-amber-400" />
                      <span>{artisan.ratingAvg > 0 ? artisan.ratingAvg : 'New'} ({artisan.totalJobsDone} jobs)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-slate-400" />
                      <span>{artisan.serviceAreas?.[0] || 'Anywhere'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 p-4 flex gap-2">
                  <Button className="flex-1">Request Quote</Button>
                  <Button variant="outline" className="px-3" onClick={() => handleMessageArtisan(artisan.userId)}>
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

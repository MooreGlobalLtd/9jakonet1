import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';
import { MapPin, Briefcase } from 'lucide-react';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

const POPULAR_TRADES = [
  "AC Technician", "Aluminum Fabricator", "Architect", "Auto Electrician", "Barber", 
  "Borehole Driller", "Carpenter", "Catering & Chef", "CCTV Installer", "Civil Engineer", 
  "Cleaner", "Computer Technician", "DJ", "Electrician", "Event Planner", "Fumigator", 
  "Generator Mechanic", "Hair Stylist", "Interior Decorator", "Inverter/Solar Installer", 
  "IT Support", "Makeup Artist", "Mason/Bricklayer", "Mechanic", "Painter", 
  "Panel Beater", "Photographer", "Plaster of Paris (POP) Designer", "Plumber", 
  "Software Engineer", "Tailor/Fashion Designer", "Tiler", "Videographer", "Vulcanizer", 
  "Welder"
];

export default function ArtisanSetup() {
  const { user, init } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [trade, setTrade] = useState('');
  const [exp, setExp] = useState('');
  
  // Location states
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    const fullLocation = `${address}, ${city}, ${state}`;

    try {
      if (!isQuotaExhausted()) {
        try {
          await setDoc(doc(db, 'artisans', user.id), {
            userId: user.id,
            tradeCategory: trade,
            yearsExp: parseInt(exp),
            serviceAreas: [fullLocation],
            state,
            city,
            address,
            whatsappNumber: whatsapp
          }, { merge: true });
        } catch (error: any) {
          if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
            markQuotaExhausted();
            console.warn('Quota exhausted, artisan profile changes not saved to cloud');
          } else {
            throw error;
          }
        }
      }
      
      // Re-init auth store to fetch updated profile
      init();
      
      if (!user.isKycVerified) {
        navigate('/verify-kyc');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-emerald-100/50">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            Complete Your Artisan Profile
          </CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            Tell us about your profession and where you work so clients can easily find you.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Trade Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                Professional Details
              </h3>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Trade / Profession</label>
                <div className="relative">
                  <Input 
                    required
                    list="trade-options"
                    placeholder="Search or type your profession (e.g. Civil Engineer)"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full"
                  />
                  <datalist id="trade-options">
                    {POPULAR_TRADES.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-slate-500 mt-1">Start typing to search, or enter any custom profession.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Years of Experience</label>
                <Input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="e.g. 5"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp Number</label>
                <p className="text-xs text-slate-500 mb-2">This is only shown to customers AFTER they hire you and create an active job offer, protecting your privacy.</p>
                <Input 
                  type="tel" 
                  required 
                  placeholder="e.g. 08012345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4 pt-2">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Service Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
                  <select 
                    required
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">City / LGA</label>
                  <Input 
                    required 
                    placeholder="e.g. Ikeja, Lekki, or Wuse"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Home / Workshop Address</label>
                <Input 
                  required 
                  placeholder="e.g. 15 Awolowo Way, Ikeja"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold h-11 text-base" disabled={loading}>
                {loading ? 'Saving Profile...' : 'Complete Setup & Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

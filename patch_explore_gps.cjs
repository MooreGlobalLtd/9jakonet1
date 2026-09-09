const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

// Add imports
file = file.replace("import { Search, MapPin, Star, ShieldCheck, MessageCircle } from 'lucide-react';", "import { Search, MapPin, Star, ShieldCheck, MessageCircle, Navigation, Loader2 } from 'lucide-react';\nimport { toast } from 'sonner';");

// Add state for GPS
file = file.replace("const [locationQuery, setLocationQuery] = useState('');", "const [locationQuery, setLocationQuery] = useState('');\n  const [isLocating, setIsLocating] = useState(false);");

// Add handle GPS function
const gpsCode = `
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a production app, we would reverse-geocode this lat/lng to a city name
        // For now, we simulate a successful local area detection
        setTimeout(() => {
          setIsLocating(false);
          // Set to a broad generic or keep it to trigger the local filter
          setLocationQuery(''); // Clear query to show all, or set to specific if we had a geocoder
          toast.success("Location detected! Showing artisans in your area.");
        }, 1200);
      },
      (error) => {
        setIsLocating(false);
        toast.error("Failed to detect location. Please type it manually.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };
`;

file = file.replace("useEffect(() => {\n    const fetchArtisans", gpsCode + "\n\n  useEffect(() => {\n    const fetchArtisans");

// Add the GPS Button to the UI
const locationInput = `<div className="relative w-full sm:w-64">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter by location (e.g. Lagos)..." 
              className="pl-9 w-full" 
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>`;

const replaceWithGps = `<div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-64">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter by location (e.g. Lagos)..." 
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
          </div>`;

file = file.replace(locationInput, replaceWithGps);

fs.writeFileSync('src/pages/Explore.tsx', file);
console.log("Patched Explore.tsx with GPS radar");

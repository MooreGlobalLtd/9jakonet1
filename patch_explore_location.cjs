const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

const targetLocationDetect = `    navigator.geolocation.getCurrentPosition(
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
      (error) => {`;

const newLocationDetect = `    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(\`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=\${latitude}&longitude=\${longitude}&localityLanguage=en\`);
          const data = await res.json();
          
          setIsLocating(false);
          let detectedLocation = '';
          
          if (data.principalSubdivision) {
             detectedLocation = data.principalSubdivision.replace(' State', '');
          } else if (data.city) {
             detectedLocation = data.city;
          }
          
          if (detectedLocation) {
             setLocationQuery(detectedLocation);
             toast.success(\`Location detected: \${detectedLocation}\`);
          } else {
             toast.error("Could not automatically determine state/city.");
          }
        } catch(err) {
          setIsLocating(false);
          toast.error("Network error detecting location.");
        }
      },
      (error) => {`;

file = file.replace(targetLocationDetect, newLocationDetect);
fs.writeFileSync('src/pages/Explore.tsx', file);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const targetLogic = `const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latitude}&lon=\${longitude}&zoom=18&addressdetails=1\`);
          const data = await res.json();
          
          setIsLocating(false);
          let detectedLocation = '';
          
          if (data && data.address) {
            const addr = data.address;
            const parts = [];
            
            // Prioritize exact street level
            if (addr.amenity || addr.building || addr.landmark) {
              parts.push(addr.amenity || addr.building || addr.landmark);
            }
            
            if (addr.house_number && addr.road) {
               parts.push(\`\${addr.house_number} \${addr.road}\`);
            } else if (addr.road) {
               parts.push(addr.road);
            }
            
            if (addr.neighbourhood || addr.suburb || addr.residential) {
              parts.push(addr.neighbourhood || addr.suburb || addr.residential);
            } else if (addr.city || addr.town || addr.village) {
              parts.push(addr.city || addr.town || addr.village);
            }
            
            if (addr.state) {
              parts.push(addr.state.replace(' State', ''));
            }
            
            // Limit to max 3 parts for a clean UI, deduplicate just in case
            detectedLocation = [...new Set(parts.filter(Boolean))].slice(0, 3).join(', ');
          }`;

const replacementLogic = `setIsLocating(false);
          let detectedLocation = '';
          const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          
          if (googleMapsApiKey) {
            // Use Google Maps Geocoding API for exact street level accuracy
            const res = await fetch(\`https://maps.googleapis.com/maps/api/geocode/json?latlng=\${latitude},\${longitude}&key=\${googleMapsApiKey}\`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
              // Google Maps usually returns the most specific address as the first result
              detectedLocation = data.results[0].formatted_address;
              // We can clean it up slightly if it's too long (e.g. removing "Nigeria")
              detectedLocation = detectedLocation.replace(', Nigeria', '');
            }
          } else {
            // Fallback to OpenStreetMap if API key is not yet set
            const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latitude}&lon=\${longitude}&zoom=18&addressdetails=1\`);
            const data = await res.json();
            
            if (data && data.address) {
              const addr = data.address;
              const parts = [];
              
              if (addr.amenity || addr.building || addr.landmark) parts.push(addr.amenity || addr.building || addr.landmark);
              if (addr.house_number && addr.road) parts.push(\`\${addr.house_number} \${addr.road}\`);
              else if (addr.road) parts.push(addr.road);
              if (addr.neighbourhood || addr.suburb || addr.residential) parts.push(addr.neighbourhood || addr.suburb || addr.residential);
              else if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
              if (addr.state) parts.push(addr.state.replace(' State', ''));
              
              detectedLocation = [...new Set(parts.filter(Boolean))].slice(0, 3).join(', ');
            }
          }`;

code = code.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/pages/Explore.tsx', code);
console.log("Explore.tsx Google Maps fallback patched successfully");

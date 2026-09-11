const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const targetFallback = `// Fallback to OpenStreetMap if API key is not yet set
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
            }`;

const replacementFallback = `// Fallback to ArcGIS Geocoding if API key is not yet set (very reliable and free)
            const res = await fetch(\`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=\${longitude},\${latitude}&outSR=4326&f=json\`);
            const data = await res.json();
            
            if (data && data.address) {
              const addr = data.address;
              const parts = [];
              
              // Prefer PlaceName / Landmark if available
              if (addr.PlaceName) parts.push(addr.PlaceName);
              else if (addr.Address) parts.push(addr.Address);
              
              if (addr.Neighborhood) parts.push(addr.Neighborhood);
              else if (addr.City) parts.push(addr.City);
              
              if (addr.Region) parts.push(addr.Region);
              
              detectedLocation = [...new Set(parts.filter(Boolean))].join(', ');
            }`;

code = code.replace(targetFallback, replacementFallback);
fs.writeFileSync('src/pages/Explore.tsx', code);
console.log("ArcGIS Fallback Patched");

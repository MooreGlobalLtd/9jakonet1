const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const targetLogic = `          if (googleMapsApiKey) {
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
            // Fallback to ArcGIS Geocoding if API key is not yet set (very reliable and free)
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
            }
          }`;

const replacementLogic = `          if (googleMapsApiKey) {
            try {
              // Use Google Maps Geocoding API for exact street level accuracy
              const res = await fetch(\`https://maps.googleapis.com/maps/api/geocode/json?latlng=\${latitude},\${longitude}&key=\${googleMapsApiKey}\`);
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
              const res = await fetch(\`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=\${longitude},\${latitude}&outSR=4326&f=json\`);
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
          }`;

code = code.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/pages/Explore.tsx', code);
console.log("Geocoding Logic Patched with Fallback");

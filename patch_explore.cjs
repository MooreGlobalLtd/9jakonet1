const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const targetStr = `const res = await fetch(\`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=\${latitude}&longitude=\${longitude}&localityLanguage=en\`);
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
          }`;

const replacementStr = `const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latitude}&lon=\${longitude}&zoom=18&addressdetails=1\`);
          const data = await res.json();
          
          setIsLocating(false);
          let detectedLocation = '';
          
          if (data && data.address) {
            const addr = data.address;
            const parts = [];
            
            if (addr.amenity || addr.building) parts.push(addr.amenity || addr.building);
            if (addr.road) parts.push(addr.road);
            if (addr.neighbourhood || addr.suburb || addr.residential) {
              parts.push(addr.neighbourhood || addr.suburb || addr.residential);
            }
            if (addr.city || addr.town || addr.village) {
              parts.push(addr.city || addr.town || addr.village);
            }
            if (addr.state) {
              parts.push(addr.state.replace(' State', ''));
            }
            
            // Limit to max 3 parts for a clean UI, deduplicate just in case
            detectedLocation = [...new Set(parts.filter(Boolean))].slice(0, 3).join(', ');
          }
          
          if (detectedLocation) {
             setLocationQuery(detectedLocation);
             toast.success(\`Location detected: \${detectedLocation}\`);
          } else {
             toast.error("Could not automatically determine your specific location.");
          }`;

if (code.includes('api.bigdatacloud.net')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/Explore.tsx', code);
    console.log("Explore.tsx patched successfully");
} else {
    console.log("Could not find target string in Explore.tsx");
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const targetLocationCall = `navigator.geolocation.getCurrentPosition(
      async (position) => {`;

const replacementLocationCall = `navigator.geolocation.getCurrentPosition(
      async (position) => {`;

const targetAddressParsing = `if (addr.amenity || addr.building) parts.push(addr.amenity || addr.building);
            if (addr.road) parts.push(addr.road);
            if (addr.neighbourhood || addr.suburb || addr.residential) {
              parts.push(addr.neighbourhood || addr.suburb || addr.residential);
            }
            if (addr.city || addr.town || addr.village) {
              parts.push(addr.city || addr.town || addr.village);
            }
            if (addr.state) {
              parts.push(addr.state.replace(' State', ''));
            }`;

const replacementAddressParsing = `// Prioritize exact street level
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
            }`;

// We also need to add the options object to getCurrentPosition
// It looks like:
/*
      },
      (error) => {
        setIsLocating(false);
...
      }
    );
*/
// We'll just regex replace the end of the getCurrentPosition call
let updatedCode = code.replace(targetAddressParsing, replacementAddressParsing);
updatedCode = updatedCode.replace(/},\s*\n\s*\(\w+\)\s*=>\s*\{[\s\S]*?toast\.error[^}]+\}\s*\}\s*,\s*\{.*?\}\s*\);|},\s*\n\s*\(\w+\)\s*=>\s*\{[\s\S]*?toast\.error[^}]+\}\s*\}\s*\);/, (match) => {
    if (match.includes('{ enableHighAccuracy')) return match; // already has options
    return match.replace(/\);$/, ', { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });');
});

fs.writeFileSync('src/pages/Explore.tsx', updatedCode);
console.log("Explore.tsx geolocation patched successfully");

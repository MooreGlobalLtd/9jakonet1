const fs = require('fs');
let code = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

const targetLogic = `    if (locationQuery) {
      filtered = filtered.filter(a => 
        a.serviceAreas.some(area => area.toLowerCase().includes(locationQuery.toLowerCase())) ||
        (a.user.state && a.user.state.toLowerCase().includes(locationQuery.toLowerCase()))
      );
    }`;

const replacementLogic = `    if (locationQuery) {
      const locQ = locationQuery.toLowerCase();
      const locWords = locQ.split(/[,\\s]+/).filter(w => w.length > 2);
      
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
    }`;

code = code.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/pages/Explore.tsx', code);
console.log("Filter logic patched!");

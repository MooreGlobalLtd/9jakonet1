const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const bannerRegex = /\s*\{\/\*\s*TEMPORARY LOGO PREVIEW BANNER\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>/m;

// To remove the banner we need to replace the banner div block AND restore the original containing div structure.
// The easiest way is to just replace the first part of the render function
if (code.includes('TEMPORARY LOGO PREVIEW BANNER')) {
    code = code.replace(
        /<div className="flex flex-col font-sans overflow-hidden">[\s\S]*?Click here to view Logos 🎨[\s\S]*?<\/div>/m,
        '<div className="flex flex-col font-sans overflow-hidden">'
    );
    fs.writeFileSync('src/pages/Home.tsx', code);
    console.log("Banner removed");
}

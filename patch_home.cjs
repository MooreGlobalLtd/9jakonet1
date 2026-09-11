const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const targetStr = '<div className="flex flex-col font-sans overflow-hidden">';
const replacementStr = `<div className="flex flex-col font-sans overflow-hidden">
      {/* TEMPORARY LOGO PREVIEW BANNER */}
      <div className="bg-emerald-600 text-white py-3 px-4 text-center relative z-50 shadow-md">
        <p className="font-medium">
          Ready to see the new logo concepts?{' '}
          <Link to="/logo-preview" className="font-bold underline ml-2 hover:text-emerald-100 bg-white/20 px-3 py-1 rounded-full transition-colors">
            Click here to view Logos 🎨
          </Link>
        </p>
      </div>`;

if(code.includes(targetStr) && !code.includes('TEMPORARY LOGO PREVIEW BANNER')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/Home.tsx', code);
}

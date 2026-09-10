const fs = require('fs');
let file = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');

const portfolioUI = `
      </Card>

      {/* Artisan Portfolio Gallery */}
      {user.role === 'artisan' && (
        <Card className="shadow-lg border-slate-200 mt-8">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 rounded-t-xl">
            <CardTitle className="text-xl flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              Work Portfolio Gallery
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Upload up to 6 high-quality photos of your past work to attract more customers.</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {portfolioImages.map((imgUrl, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-50">
                  <img src={imgUrl} alt={\`Portfolio \${i+1}\`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <button 
                    type="button"
                    onClick={() => removePortfolioImage(i)}
                    className="absolute top-2 right-2 bg-slate-900/60 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {portfolioImages.length < 6 && (
                <label className="relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-colors group">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    {portfolioUploading ? (
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    ) : (
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                    )}
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600">
                      {portfolioUploading ? 'Uploading...' : 'Add Photo'}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePortfolioUpload} 
                    disabled={portfolioUploading}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
`;

file = file.replace(/<\/Card>\s*<\/div>\s*}\s*$/, portfolioUI);
fs.writeFileSync('src/pages/Profile.tsx', file);
console.log("Patched UI");

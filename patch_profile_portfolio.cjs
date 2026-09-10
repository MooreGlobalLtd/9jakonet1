const fs = require('fs');
let file = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');

const portfolioUI = `
      {user.role === 'artisan' && (
        <Card className="shadow-xs border-slate-200 mt-6">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              Work Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-6">
              Upload photos of your past work. Customers love seeing visual proof of your skills! (Max 6 images)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {portfolioImages.map((img, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={img} alt={\`Portfolio \${idx + 1}\`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePortfolioImage(idx)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {portfolioImages.length < 6 && (
                <div className="aspect-square">
                  <input 
                    type="file" 
                    id="portfolio-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePortfolioUpload} 
                    disabled={portfolioUploading}
                  />
                  <label 
                    htmlFor="portfolio-upload"
                    className="w-full h-full border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-emerald-700"
                  >
                    {portfolioUploading ? (
                      <span className="animate-spin text-2xl">⏳</span>
                    ) : (
                      <>
                        <Plus className="h-8 w-8 mb-2" />
                        <span className="text-xs font-semibold">Add Photo</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
`;

file = file.replace(/    <\/div>\n  \);\n\}/, portfolioUI);
fs.writeFileSync('src/pages/Profile.tsx', file);

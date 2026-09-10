const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

const targetGrid = `                  <p className="font-bold text-slate-900 mt-0.5 w-full truncate px-2" title={selectedArtisan.serviceAreas?.[0] || 'Anywhere'}>
                    {selectedArtisan.serviceAreas?.[0] || 'Anywhere'}
                  </p>
                </div>
              </div>`;

const portfolioBlock = `                  <p className="font-bold text-slate-900 mt-0.5 w-full truncate px-2" title={selectedArtisan.serviceAreas?.[0] || 'Anywhere'}>
                    {selectedArtisan.serviceAreas?.[0] || 'Anywhere'}
                  </p>
                </div>
              </div>

              {selectedArtisan.portfolioImages && selectedArtisan.portfolioImages.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    Portfolio Gallery
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedArtisan.portfolioImages.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                        <img src={img} alt={\`Portfolio \${idx + 1}\`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}`;

file = file.replace(targetGrid, portfolioBlock);

if (!file.includes("ImageIcon")) {
    file = file.replace(/Briefcase } from 'lucide-react';/, "Briefcase, Image as ImageIcon } from 'lucide-react';");
}

fs.writeFileSync('src/pages/Explore.tsx', file);

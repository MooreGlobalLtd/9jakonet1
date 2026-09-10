const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

// Remove shadcn dialog imports
file = file.replace(/import \{ Dialog, DialogContent, DialogHeader, DialogTitle \} from '\.\.\/components\/ui\/dialog';\n/, "");

// Replace the shadcn Dialog block with a custom tailwind modal
const customModalTarget = `<Dialog open={!!selectedArtisan} onOpenChange={(open) => !open && setSelectedArtisan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Artisan Profile</DialogTitle>
          </DialogHeader>
          
          {selectedArtisan && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <img 
                  src={selectedArtisan.user?.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(selectedArtisan.user?.displayName || 'A')}\`} 
                  alt={selectedArtisan.user?.displayName} 
                  className="h-20 w-20 rounded-full object-cover shadow-sm border border-slate-200" 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900">{selectedArtisan.user?.displayName}</h2>
                    {(selectedArtisan.verificationStatus === 'verified' || selectedArtisan.user?.isKycVerified || selectedArtisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" title="KYC Verified" />
                    )}
                  </div>
                  <p className="text-emerald-600 font-medium">{selectedArtisan.tradeCategory}</p>
                  <div className="flex items-center mt-1 text-slate-600 text-sm">
                    {renderStars(selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg : 5)}
                    <span className="font-bold text-slate-900 ml-2 mr-1">{selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-500">({selectedArtisan.totalJobsDone > 0 ? selectedArtisan.totalJobsDone : 0} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">About</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedArtisan.bio || "No bio provided yet."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1 text-slate-500">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Experience</span>
                  </div>
                  <p className="font-semibold text-slate-900">{selectedArtisan.yearsExp || 0} Years</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Location</span>
                  </div>
                  <p className="font-semibold text-slate-900 truncate" title={selectedArtisan.serviceAreas?.[0] || 'Anywhere'}>
                    {selectedArtisan.serviceAreas?.[0] || 'Anywhere'}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-medium"
                onClick={() => {
                  handleMessageArtisan(selectedArtisan.userId);
                  setSelectedArtisan(null);
                }}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Message {selectedArtisan.user?.displayName?.split(' ')[0]}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>`;

const customModalReplacement = `{selectedArtisan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Artisan Profile</h2>
              <button 
                onClick={() => setSelectedArtisan(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-start gap-5">
                <img 
                  src={selectedArtisan.user?.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(selectedArtisan.user?.displayName || 'A')}\`} 
                  alt={selectedArtisan.user?.displayName} 
                  className="h-24 w-24 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-slate-100" 
                />
                <div className="pt-2">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedArtisan.user?.displayName}</h2>
                    {(selectedArtisan.verificationStatus === 'verified' || selectedArtisan.user?.isKycVerified || selectedArtisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" title="KYC Verified" />
                    )}
                  </div>
                  <p className="text-emerald-600 font-medium text-sm mt-0.5">{selectedArtisan.tradeCategory}</p>
                  <div className="flex items-center mt-2 text-slate-600 text-sm">
                    {renderStars(selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg : 5)}
                    <span className="font-bold text-slate-900 ml-2 mr-1">{selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-500">({selectedArtisan.totalJobsDone > 0 ? selectedArtisan.totalJobsDone : 0} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  About Me
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedArtisan.bio || "This professional hasn't written a bio yet, but they are ready for work!"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedArtisan.yearsExp || 0} Years</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</p>
                  <p className="font-bold text-slate-900 mt-0.5 w-full truncate px-2" title={selectedArtisan.serviceAreas?.[0] || 'Anywhere'}>
                    {selectedArtisan.serviceAreas?.[0] || 'Anywhere'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold shadow-md"
                onClick={() => {
                  handleMessageArtisan(selectedArtisan.userId);
                  setSelectedArtisan(null);
                }}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Message {selectedArtisan.user?.displayName?.split(' ')[0] || 'Artisan'} Now
              </Button>
            </div>
            
          </div>
        </div>
      )}`;

file = file.replace(customModalTarget, customModalReplacement);
fs.writeFileSync('src/pages/Explore.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

// 1. Add X icon and Dialog imports if not exist
if (!file.includes("import { Dialog")) {
  file = file.replace(/import \{ Input \} from '\.\.\/components\/ui\/input';/, "import { Input } from '../components/ui/input';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';");
}
if (!file.includes("BadgeCheck")) {
  file = file.replace(/Search, MapPin, Star, ShieldCheck, MessageCircle, Navigation, Loader2, X, CheckCircle2, Phone/g, "Search, MapPin, Star, ShieldCheck, MessageCircle, Navigation, Loader2, X, CheckCircle2, Phone, BadgeCheck, Briefcase");
}

// 2. Replace the artisan mapping to use Twitter style verified badge and star ratings
const cardContentTarget = `<div className="flex items-start justify-between">
                    <img 
                      src={artisan.user?.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(artisan.user?.displayName || 'A')}\`} 
                      alt={artisan.user?.displayName} 
                      className="h-16 w-16 rounded-full object-cover shadow-sm border border-slate-100" 
                    />
                    {artisan.verificationStatus === 'verified' && (
                      <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-lg text-slate-900">{artisan.user?.displayName}</h3>`;

const cardContentReplacement = `<div className="flex items-start justify-between">
                    <img 
                      src={artisan.user?.avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(artisan.user?.displayName || 'A')}\`} 
                      alt={artisan.user?.displayName} 
                      className="h-16 w-16 rounded-full object-cover shadow-sm border border-slate-100" 
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <h3 className="font-semibold text-lg text-slate-900">{artisan.user?.displayName}</h3>
                    {(artisan.verificationStatus === 'verified' || artisan.user?.isKycVerified || artisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" title="KYC Verified" />
                    )}
                  </div>`;
file = file.replace(cardContentTarget, cardContentReplacement);

// 3. Add Dialog before the closing div
const dialogBlock = `
      {/* Artisan Profile Modal */}
      <Dialog open={!!selectedArtisan} onOpenChange={(open) => !open && setSelectedArtisan(null)}>
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
                    <Star className="mr-1 h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-slate-900 mr-1">{selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg.toFixed(1) : '5.0'}</span>
                    <span>({selectedArtisan.totalJobsDone > 0 ? selectedArtisan.totalJobsDone : 0} reviews)</span>
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
      </Dialog>
    </div>
  );
}`;

file = file.replace(/    <\/div>\n  \);\n\}/, dialogBlock);
fs.writeFileSync('src/pages/Explore.tsx', file);

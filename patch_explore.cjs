const fs = require('fs');
let content = fs.readFileSync('src/pages/Explore.tsx', 'utf8');

// We want to add a Pro badge check inside the Artisan profile card
const oldHeader = `                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedArtisan.user?.displayName}</h2>
                    {(selectedArtisan.verificationStatus === 'verified' || selectedArtisan.user?.isKycVerified || selectedArtisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" title="KYC Verified" />
                    )}
                  </div>`;
const newHeader = `                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedArtisan.user?.displayName}</h2>
                    {(selectedArtisan.verificationStatus === 'verified' || selectedArtisan.user?.isKycVerified || selectedArtisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" title="KYC Verified" />
                    )}
                    {selectedArtisan.isPremium && (
                      <span className="flex items-center justify-center h-6 w-6 bg-amber-100 rounded-full shrink-0" title="9jaKonet Pro">
                        <span className="text-amber-600 text-sm">👑</span>
                      </span>
                    )}
                  </div>`;
content = content.replace(oldHeader, newHeader);

const oldCardHeader = `                  <div className="mt-4 flex items-center gap-1.5">
                    <h3 className="font-semibold text-lg text-slate-900">{artisan.user?.displayName}</h3>
                    {(artisan.verificationStatus === 'verified' || artisan.user?.isKycVerified || artisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" title="KYC Verified" />
                    )}
                  </div>`;
const newCardHeader = `                  <div className="mt-4 flex items-center gap-1.5">
                    <h3 className="font-semibold text-lg text-slate-900">{artisan.user?.displayName}</h3>
                    {(artisan.verificationStatus === 'verified' || artisan.user?.isKycVerified || artisan.user?.kyc?.status === 'verified') && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" title="KYC Verified" />
                    )}
                    {artisan.isPremium && (
                      <span className="flex items-center justify-center h-5 w-5 bg-amber-100 rounded-full shrink-0" title="9jaKonet Pro">
                        <span className="text-amber-600 text-[10px]">👑</span>
                      </span>
                    )}
                  </div>`;
content = content.replace(oldCardHeader, newCardHeader);

fs.writeFileSync('src/pages/Explore.tsx', content);

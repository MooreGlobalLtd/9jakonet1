const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const replacement = `              {user.role === 'artisan' && artisanProfile && (
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Trade</span>
                    <span className="font-medium text-slate-900">{artisanProfile.tradeCategory || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Verification</span>
                    <span className={\`font-medium \${artisanProfile.verificationStatus === 'verified' || user.isKycVerified || user.kyc?.status === 'verified' ? 'text-emerald-600' : 'text-amber-600'}\`}>
                      {artisanProfile.verificationStatus === 'verified' || user.isKycVerified || user.kyc?.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span>Rating</span>
                    <span className="font-medium text-slate-900">{artisanProfile.ratingAvg || 'New'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {user.role === 'artisan' && (
            <Card className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm animate-in fade-in duration-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 font-bold text-lg">👑</span>
                  </div>
                  <h3 className="font-bold text-slate-900">9jaKonet Pro</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Coming soon in Q4! Upgrade to <strong>Pro</strong> to get a Verified Pro badge and rank at the top of customer search results. 
                </p>
                <Button 
                  variant="outline" 
                  className="w-full bg-white border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                  onClick={() => alert("🎉 You have been added to the VIP waitlist! We will notify you the moment 9jaKonet Pro launches.")}
                >
                  Join the VIP Waitlist
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
`;
content = content.replace(/              \{user\.role === 'artisan' && artisanProfile && \([\s\S]*?\}\n/g, replacement);
fs.writeFileSync('src/pages/Dashboard.tsx', content);

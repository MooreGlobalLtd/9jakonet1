const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(`        </Card>\n      </div>\n\n      {/* KYC Document & Selfie Inspection Modal */}`, `        </Card>\n        )}\n      </div>\n\n      {/* KYC Document & Selfie Inspection Modal */}`);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);

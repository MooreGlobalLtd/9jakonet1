const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Fix the bad injects
code = code.replace(`        </Card>\n        )}\n      </div>\n\n      {/* EXPANDED DRILL-DOWN DETAILS SECTION */}`, `        </Card>\n      </div>\n\n      {/* EXPANDED DRILL-DOWN DETAILS SECTION */}`);

code = code.replace(`        </Card>\n        )}\n      </div>\n\n      {/* KYC Document & Selfie Inspection Modal */}`, `        </Card>\n        )}\n      </div>\n\n      {/* KYC Document & Selfie Inspection Modal */}`); // Wait, this one actually needs the )} because we opened it with {isSuperAdmin && (

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);

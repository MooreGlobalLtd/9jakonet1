const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

if (!app.includes("import { Toaster } from 'sonner'")) {
  app = app.replace("import React, { useEffect } from 'react';", "import React, { useEffect } from 'react';\nimport { Toaster } from 'sonner';");
  
  app = app.replace("<BrowserRouter>", "<BrowserRouter>\n      <Toaster position=\"top-center\" richColors />");
  
  fs.writeFileSync('src/App.tsx', app);
  console.log("Patched App.tsx with Toaster");
} else {
  console.log("Toaster already present");
}

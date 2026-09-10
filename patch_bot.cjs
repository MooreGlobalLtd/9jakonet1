const fs = require('fs');
let code = fs.readFileSync('src/components/chat/KonetBot.tsx', 'utf8');

if (!code.includes("import { motion } from 'framer-motion'")) {
  code = code.replace(
    "import { Button } from '../ui/button';",
    "import { Button } from '../ui/button';\nimport { motion } from 'framer-motion';"
  );
  
  // Make the entire container draggable by replacing <div id="konetbot-container"...> with <motion.div drag dragMomentum={false}...>
  code = code.replace(
    '<div id="konetbot-container" className="fixed bottom-5 right-5 z-50 flex flex-col items-end">',
    '<motion.div drag dragMomentum={false} id="konetbot-container" className="fixed bottom-5 right-5 z-50 flex flex-col items-end" style={{ touchAction: "none" }}>'
  );
  
  code = code.replace(
    /<\/div>\s*$/i,
    '</motion.div>\n  );\n}\n'
  );

  fs.writeFileSync('src/components/chat/KonetBot.tsx', code);
}

const fs = require('fs');
let code = fs.readFileSync('src/components/chat/KonetBot.tsx', 'utf8');

const targetStr = `        </div>
      )}
    </div>
  );
}
`;

const replacement = `        </div>
      )}
    </motion.div>
  );
}
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/chat/KonetBot.tsx', code);

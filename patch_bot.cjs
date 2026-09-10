const fs = require('fs');
let file = fs.readFileSync('src/lib/botEngine.ts', 'utf-8');

// Fix the AC regex
file = file.replace(
  "/ac|air condition|refrigerator|fridge|cooling|chiller|gas refill/",
  "/\\bac\\b|air condition|refrigerator|fridge|cooling|chiller|gas refill/"
);

// Fix the plumber leak regex just in case (leak -> \\bleak\\b)
file = file.replace(
  "/plumber|plumbing|pipe|leak|tap|water heater|sink|borehole|water pump|drainage/",
  "/plumber|plumbing|pipe|\\bleak\\b|tap|water heater|sink|borehole|water pump|drainage/"
);

// Fix the auto regex
file = file.replace(
  "/mechanic|auto|car repair|brake|engine|panel beater|vulcanizer|spray paint car/",
  "/mechanic|\\bauto\\b|car repair|brake|engine|panel beater|vulcanizer|spray paint car/"
);

// Fix the paint regex
file = file.replace(
  "/paint|tiler|welder|mason|clean|masonry|welding|iron|fumigation|flooring/",
  "/painter|painting|tiler|welder|mason|clean|masonry|welding|iron|fumigation|flooring/"
);

fs.writeFileSync('src/lib/botEngine.ts', file);

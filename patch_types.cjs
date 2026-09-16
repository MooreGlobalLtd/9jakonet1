const fs = require('fs');
let content = fs.readFileSync('src/types/index.ts', 'utf8');

const target = `completedAt?: number;
}`;

const replacement = `completedAt?: number;
  contractType?: 'service' | 'product';
  itemId?: string;
  trackingNumber?: string;
  deliveryPin?: string;
  deliveryAddress?: string;
}`;

if (!content.includes('contractType?:')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/types/index.ts', content);
}

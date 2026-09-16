const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

content = content.replace(
  "import { MessageCircle, ShieldCheck, Banknote, CheckCircle, Clock, Star, KeyRound, AlertCircle, RefreshCw, X, ArrowRight, MapPin } from 'lucide-react';",
  "import { MessageCircle, ShieldCheck, Banknote, CheckCircle, Clock, Star, KeyRound, AlertCircle, RefreshCw, X, ArrowRight, MapPin, ShoppingBag } from 'lucide-react';"
);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

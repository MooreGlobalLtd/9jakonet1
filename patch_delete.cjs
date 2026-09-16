const fs = require('fs');
let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

// 1. imports
content = content.replace(
  "import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';",
  "import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';"
);
content = content.replace(
  "import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, ShoppingBag, ShieldCheck, Car, Smartphone, Laptop, Sofa, Shirt, Home, MoreHorizontal } from 'lucide-react';",
  "import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, ShoppingBag, ShieldCheck, Car, Smartphone, Laptop, Sofa, Shirt, Home, MoreHorizontal, Trash2 } from 'lucide-react';"
);

// 2. Delete function
const targetHandleMessage = `  const handleMessageSeller = async (sellerId: string) => {`;
const insertHandleDelete = `  const handleDeleteAd = async (itemId: string, sellerId: string) => {
    if (!user || user.id !== sellerId) return;
    if (!confirm('Are you sure you want to delete this ad?')) return;
    
    try {
      await deleteDoc(doc(db, 'marketplace_items', itemId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete ad.');
    }
  };

  const handleMessageSeller = async (sellerId: string) => {`;
content = content.replace(targetHandleMessage, insertHandleDelete);

// 3. Replace the Buy with Escrow block with conditional render
const targetButtonBlock = `                    {user?.id !== item.sellerId && (
                      <Button 
                        onClick={() => user ? setCheckoutItem(item) : navigate('/login')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Buy with Escrow
                      </Button>
                    )}`;
const insertButtonBlock = `                    {user?.id !== item.sellerId ? (
                      <Button 
                        onClick={() => user ? setCheckoutItem(item) : navigate('/login')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Buy with Escrow
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleDeleteAd(item.id, item.sellerId)}
                        variant="outline"
                        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Ad
                      </Button>
                    )}`;
content = content.replace(targetButtonBlock, insertButtonBlock);

fs.writeFileSync('src/pages/Marketplace.tsx', content);

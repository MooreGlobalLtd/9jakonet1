const fs = require('fs');
let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

const importsToAdd = `
import { MessageCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { EscrowContract } from '../types';
import { getDocs, where } from 'firebase/firestore';
`;

content = content.replace("import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation } from 'lucide-react';", "import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, ShoppingBag, ShieldCheck } from 'lucide-react';\nimport { PaystackButton } from 'react-paystack';\nimport { getDocs, where } from 'firebase/firestore';");

// Need to define state for Checkout Modal
const checkoutState = `
  const [paystackPublicKey, setPaystackPublicKey] = useState<string>(
    localStorage.getItem('paystack_public_key') || ''
  );
  
  useEffect(() => {
    getDoc(doc(db, 'system_config', 'paystack'))
      .then(snap => {
        if (snap.exists() && snap.data().publicKey) {
          setPaystackPublicKey(snap.data().publicKey);
          localStorage.setItem('paystack_public_key', snap.data().publicKey);
        }
      })
      .catch(err => console.warn('Could not load public key:', err));
  }, []);

  const [checkoutItem, setCheckoutItem] = useState<MarketplaceItem | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const handleMessageSeller = async (sellerId: string) => {
    if (!user) return navigate('/login');
    if (user.id === sellerId) return alert('You cannot message yourself.');
    
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', user.id));
      const snap = await getDocs(q);
      
      let existingChatId = null;
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.participants.includes(sellerId)) {
          existingChatId = docSnap.id;
        }
      });
      
      if (existingChatId) {
        navigate(\`/messages?chat=\${existingChatId}\`);
      } else {
        const newChat = await addDoc(chatsRef, {
          participants: [user.id, sellerId],
          updatedAt: Date.now(),
        });
        navigate(\`/messages?chat=\${newChat.id}\`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to start chat.');
    }
  };

  const handleCheckoutSuccess = async (ref: any) => {
    if (!user || !checkoutItem) return;
    try {
      const contract: Omit<any, 'id'> = {
        customerId: user.id,
        customerName: user.displayName,
        artisanId: checkoutItem.sellerId,
        artisanName: checkoutItem.sellerName,
        title: checkoutItem.title,
        amount: checkoutItem.price,
        platformFee: 0,
        artisanPayout: checkoutItem.price,
        status: 'in_progress', // paid immediately
        createdAt: Date.now(),
        fundedAt: Date.now(),
        escrowFunded: true,
        paystackReference: ref.reference,
        contractType: 'product',
        itemId: checkoutItem.id,
        deliveryAddress: deliveryAddress,
        buyerPhone: buyerPhone
      };
      
      await addDoc(collection(db, 'jobs'), contract); // using jobs collection for escrow
      
      alert('Payment successful! Your money is safe in Escrow. Check your Jobs & Escrow dashboard.');
      setCheckoutItem(null);
      navigate('/jobs');
    } catch (e) {
      console.error(e);
      alert('Error creating Escrow contract.');
    }
  };
`;

content = content.replace("const [isLocating, setIsLocating] = useState(false);", "const [isLocating, setIsLocating] = useState(false);\n" + checkoutState);

// Add Buttons to Card
const buttonsToReplace = `
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Posted by {item.sellerName.split(' ')[0]}
                    </span>
                    <a 
                      href={\`tel:\${item.sellerPhone}\`} 
                      className="inline-flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                      title="Call Seller"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
`;

const newButtons = `
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">
                        Seller: {item.sellerName.split(' ')[0]}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleMessageSeller(item.sellerId)}
                          className="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                          title="Message Seller"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <a 
                          href={\`tel:\${item.sellerPhone}\`} 
                          className="inline-flex items-center justify-center p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                          title="Call Seller"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    {user?.id !== item.sellerId && (
                      <Button 
                        onClick={() => user ? setCheckoutItem(item) : navigate('/login')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Buy with Escrow
                      </Button>
                    )}
                  </div>
`;

content = content.replace(buttonsToReplace, newButtons);

// Add Checkout Modal at the end
const checkoutModal = `
      {/* Checkout Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setCheckoutItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Secure Checkout</h2>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-1">{checkoutItem.title}</h3>
              <p className="text-xl font-bold text-emerald-600">₦{checkoutItem.price.toLocaleString()}</p>
              <div className="mt-2 text-xs text-slate-500">Seller: {checkoutItem.sellerName}</div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Delivery Address</label>
                <Input required value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Full street address..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Phone Number</label>
                <Input required value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="080..." />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-sm mb-6 flex gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p>Your money will be held securely in Escrow until you receive this item and confirm delivery.</p>
            </div>

            {(!paystackPublicKey || paystackPublicKey.trim() === '') ? (
              <Button disabled className="w-full bg-slate-400 text-white">Payment Gateway Offline</Button>
            ) : (
              <PaystackButton
                email={user?.email || ''}
                amount={checkoutItem.price * 100}
                metadata={{
                  name: user?.displayName || '',
                  phone: buyerPhone || '',
                  custom_fields: []
                }}
                publicKey={paystackPublicKey}
                text="Pay Securely into Escrow"
                onSuccess={handleCheckoutSuccess}
                onClose={() => console.log("Payment window closed.")}
                disabled={!deliveryAddress || !buyerPhone}
                className={\`w-full h-12 rounded-md font-medium text-white transition-colors \${(!deliveryAddress || !buyerPhone) ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}\`}
              />
            )}
          </div>
        </div>
      )}
`;

content = content.replace("    </div>\n  );\n}\n", checkoutModal + "    </div>\n  );\n}\n");

fs.writeFileSync('src/pages/Marketplace.tsx', content);

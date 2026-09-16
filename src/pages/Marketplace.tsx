import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { MarketplaceItem } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { uploadToCloudinary } from '../lib/cloudinary';
import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { getDocs, where } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function Marketplace() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Post Ad Modal State
  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
        navigate(`/messages?chat=${existingChatId}`);
      } else {
        const newChat = await addDoc(chatsRef, {
          participants: [user.id, sellerId],
          updatedAt: Date.now(),
        });
        navigate(`/messages?chat=${newChat.id}`);
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

  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'used'>('used');
  const [stateName, setStateName] = useState('Lagos');
  const [cityName, setCityName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const defaultCategories = ['Electronics', 'Vehicles', 'Fashion', 'Home & Furniture', 'Tools', 'Real Estate', 'Services', 'Other'];
  
  const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ];

  useEffect(() => {
    const q = query(collection(db, 'marketplace_items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const itemsList: MarketplaceItem[] = [];
      snap.forEach(doc => {
        itemsList.push({ id: doc.id, ...doc.data() } as MarketplaceItem);
      });
      setItems(itemsList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        // Use free OpenStreetMap Nominatim API for reverse geocoding
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.suburb || '';
          const state = data.address.state || '';
          
          if (city) setCityName(city);
          if (state) {
            const matchedState = states.find(s => state.toLowerCase().includes(s.toLowerCase()));
            if (matchedState) setStateName(matchedState);
          }
        } else {
           setCityName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (e) {
        console.error("Geocoding failed", e);
        // Fallback to coordinates if API fails
        setCityName(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      } finally {
        setIsLocating(false);
      }
    }, (error) => {
      alert('Unable to retrieve your location. Please type it manually.');
      setIsLocating(false);
    });
  };

  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!selectedImage) return alert('Please select at least one image.');
    
    // NOTE FOR NOVEMBER: 
    // Here we can fetch the user's total posts today.
    // If posts >= 2 and user.subscription !== 'pro', show upgrade modal instead.
    
    setIsSubmitting(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userPhone = userDoc.exists() ? userDoc.data().phone || '' : '';

      const imageUrl = await uploadToCloudinary(selectedImage);
      
      const newItem: Omit<MarketplaceItem, 'id'> = {
        sellerId: user.id,
        sellerName: user.displayName,
        sellerPhone: userPhone,
        title,
        description,
        price: Number(price),
        category: category || 'Other',
        condition,
        images: [imageUrl],
        state: stateName,
        city: cityName,
        status: 'active',
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'marketplace_items'), newItem);
      setIsPosting(false);
      
      // Check if they have a bank set up
      const bankName = userDoc.exists() ? userDoc.data().bankName : null;
      if (!bankName || bankName === 'Not Set' || bankName === '') {
        setTimeout(() => {
          alert('Item Posted! IMPORTANT: Please click the "Bank Details" button in the marketplace to add your bank account. You cannot receive payments from buyers without it!');
        }, 500);
      }
      
      // Reset form
      setTitle(''); setDescription(''); setPrice(''); setCityName(''); setCategory(''); setSelectedImage(null);
    } catch (err) {
      console.error(err);
      alert('Failed to post ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.status === 'active' &&
    (item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.state.toLowerCase().includes(search.toLowerCase()) ||
    item.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-8 h-8 text-emerald-600" />
              9jaKonet Marketplace
            </h1>
            <p className="text-slate-600 mt-1">Buy and sell items securely in your city.</p>
            <div className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              LAUNCH PROMO: UNLIMITED FREE LISTINGS UNTIL NOV 1ST
            </div>
          </div>
          
          <div className="flex gap-3">
            {user && (
              <Button onClick={() => navigate('/wallet')} variant="outline" className="h-12 px-6 shadow-sm border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-banknote w-5 h-5 mr-2 text-emerald-600"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                Bank Details
              </Button>
            )}
            <Button onClick={() => user ? setIsPosting(true) : navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              Sell an Item
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search for phones, cars, furniture, or your city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <Store className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">No items found</h3>
            <p className="text-slate-500 mt-2 mb-6">Be the first to sell something!</p>
            <Button onClick={() => user ? setIsPosting(true) : navigate('/login')} variant="outline">
              Post an Ad
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all border-slate-200 group">
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {item.condition}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1">{item.title}</h3>
                  </div>
                  <p className="text-xl font-bold text-emerald-600 mb-3">₦{item.price.toLocaleString()}</p>
                  
                  <div className="flex items-center text-sm text-slate-500 mb-4 gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate" title={`${item.city}, ${item.state}`}>{item.city}, {item.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4 shrink-0" />
                      <span className="truncate" title={item.category}>{item.category}</span>
                    </div>
                  </div>

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
                          href={`tel:${item.sellerPhone}`} 
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Post Ad Modal */}
      {isPosting && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">Post an Ad</h2>
              <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePostAd} className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium mb-6 flex gap-3 items-start">
                <span>🔥</span>
                <p><strong>Launch Promo:</strong> Posting ads on 9jaKonet Marketplace is 100% FREE right now! You can post an unlimited amount of items.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. iPhone 13 Pro Max (128GB)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₦)</label>
                  <Input type="number" required min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                  <select 
                    value={condition} 
                    onChange={(e: any) => setCondition(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="new">Brand New</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input 
                    type="text"
                    list="categories-list"
                    required
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Select or type category..."
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="categories-list">
                    {defaultCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <select 
                    value={stateName} 
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City / Exact Area</label>
                <div className="flex gap-2">
                  <Input 
                    required 
                    value={cityName} 
                    onChange={e => setCityName(e.target.value)} 
                    placeholder="Type address or tap GPS..." 
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGetLocation} 
                    disabled={isLocating}
                    title="Get My Location"
                    className="px-3"
                  >
                    {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : <Navigation className="w-5 h-5 text-emerald-600" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your item, its features, and any issues..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Posting Ad...
                  </>
                ) : 'Post Ad for Free'}
              </Button>
            </form>
          </div>
        </div>
      )}

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
                className={`w-full h-12 rounded-md font-medium text-white transition-colors ${(!deliveryAddress || !buyerPhone) ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

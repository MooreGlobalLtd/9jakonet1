import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, deleteDoc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { MarketplaceItem } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { uploadToCloudinary } from '../lib/cloudinary';
import { 
  Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, 
  ShoppingBag, ShieldCheck, Car, Smartphone, Laptop, Sofa, Shirt, Home, 
  MoreHorizontal, Trash2, Search, CheckCircle2, Share2, Send, HelpCircle, 
  Sparkles, Wrench, ChevronRight, Check
} from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { useNavigate } from 'react-router-dom';

export default function Marketplace() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Listings state
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state (Jiji style)
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All Nigeria');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my_ads'>('all');

  // Modals & Detailed Views
  const [selectedDetailItem, setSelectedDetailItem] = useState<MarketplaceItem | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Visual Categories with icons (Jiji inspiration)
  const visualCategories = [
    { name: 'All', icon: <Store className="w-4 h-4" /> },
    { name: 'Vehicles', icon: <Car className="w-4 h-4" /> },
    { name: 'Electronics', icon: <Smartphone className="w-4 h-4" /> },
    { name: 'Computers', icon: <Laptop className="w-4 h-4" /> },
    { name: 'Furniture', icon: <Sofa className="w-4 h-4" /> },
    { name: 'Fashion', icon: <Shirt className="w-4 h-4" /> },
    { name: 'Properties', icon: <Home className="w-4 h-4" /> },
    { name: 'Other', icon: <MoreHorizontal className="w-4 h-4" /> },
  ];
  
  // Post Ad Modal State
  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<string>('used');
  const [stateName, setStateName] = useState('Lagos');
  const [cityName, setCityName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Checkout Modal State
  const [checkoutItem, setCheckoutItem] = useState<MarketplaceItem | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const [paystackPublicKey, setPaystackPublicKey] = useState<string>(
    localStorage.getItem('paystack_public_key') || ''
  );

  const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ];

  const defaultCategories = [
    'Electronics', 'Vehicles', 'Fashion', 'Home & Furniture', 
    'Computers', 'Tools', 'Real Estate', 'Services', 'Other'
  ];

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

  // Fetch Items in Real-Time
  useEffect(() => {
    const q = query(collection(db, 'marketplace_items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const itemsList: MarketplaceItem[] = [];
      snap.forEach(docSnap => {
        itemsList.push({ id: docSnap.id, ...docSnap.data() } as MarketplaceItem);
      });
      setItems(itemsList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Format Condition Badge
  const getConditionLabel = (cond?: string) => {
    if (!cond) return 'Used';
    if (cond === 'new') return 'Brand New';
    if (cond === 'tokunbo') return 'Foreign Used (Tokunbo)';
    if (cond === 'nigerian_used') return 'Nigerian Used';
    return cond.charAt(0).toUpperCase() + cond.slice(1);
  };

  const getConditionColor = (cond?: string) => {
    if (cond === 'new') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (cond === 'tokunbo') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (cond === 'nigerian_used') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Delete Ad Handler
  const handleDeleteAd = async (itemId: string, sellerId: string) => {
    if (!user || user.id !== sellerId) return;
    try {
      await deleteDoc(doc(db, 'marketplace_items', itemId));
      if (selectedDetailItem?.id === itemId) {
        setSelectedDetailItem(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete ad.');
    }
  };

  // Toggle Sold Status
  const handleToggleSoldStatus = async (item: MarketplaceItem) => {
    if (!user || user.id !== item.sellerId) return;
    const newStatus = item.status === 'sold' ? 'active' : 'sold';
    try {
      await updateDoc(doc(db, 'marketplace_items', item.id), { status: newStatus });
      if (selectedDetailItem?.id === item.id) {
        setSelectedDetailItem({ ...selectedDetailItem, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  // Message Seller with Pre-canned Quick Chips (Jiji Style)
  const handleMessageSeller = async (sellerId: string, customText?: string) => {
    if (!user) return navigate('/login');
    if (user.id === sellerId) return alert('You cannot message yourself.');
    
    setIsSendingMessage(true);
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', user.id));
      const snap = await getDocs(q);
      
      let existingChatId: string | null = null;
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.participants && data.participants.includes(sellerId)) {
          existingChatId = docSnap.id;
        }
      });
      
      let targetChatId = existingChatId;
      if (!targetChatId) {
        const newChat = await addDoc(chatsRef, {
          participants: [user.id, sellerId],
          updatedAt: Date.now(),
          lastMessage: customText || 'Hello, I am interested in your item.',
          lastSenderId: user.id
        });
        targetChatId = newChat.id;
      }

      // If there is an introductory message to send
      if (customText && targetChatId) {
        await addDoc(collection(db, 'chats', targetChatId, 'messages'), {
          chatId: targetChatId,
          senderId: user.id,
          text: customText,
          createdAt: Date.now()
        });
        await updateDoc(doc(db, 'chats', targetChatId), {
          lastMessage: customText,
          lastMessageTime: Date.now(),
          lastSenderId: user.id,
          updatedAt: Date.now()
        });
      }

      setIsSendingMessage(false);
      setSelectedDetailItem(null);
      navigate(`/messages?chat=${targetChatId}`);
    } catch (e) {
      console.error(e);
      setIsSendingMessage(false);
      alert('Failed to start chat.');
    }
  };

  // Checkout with Escrow
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
        status: 'in_progress', // paid immediately into escrow
        createdAt: Date.now(),
        fundedAt: Date.now(),
        escrowFunded: true,
        paystackReference: ref.reference,
        contractType: 'product',
        itemId: checkoutItem.id,
        deliveryAddress: deliveryAddress,
        buyerPhone: buyerPhone
      };
      
      await addDoc(collection(db, 'jobs'), contract);
      alert('Payment successful! Your money is held safely in 9jaKonet Escrow until you receive and confirm your item.');
      setCheckoutItem(null);
      setSelectedDetailItem(null);
      navigate('/jobs');
    } catch (e) {
      console.error(e);
      alert('Error creating Escrow contract.');
    }
  };

  // Geolocation lookup
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
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
        setCityName(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      } finally {
        setIsLocating(false);
      }
    }, () => {
      alert('Unable to retrieve your location. Please type it manually.');
      setIsLocating(false);
    });
  };

  // Post Ad
  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!selectedImage) return alert('Please select at least one image.');
    
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
        isNegotiable: isNegotiable,
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
      
      // Check bank setup
      const bankName = userDoc.exists() ? userDoc.data().bankName : null;
      if (!bankName || bankName === 'Not Set' || bankName === '') {
        setTimeout(() => {
          alert('Item Posted! IMPORTANT: Please click the "Bank Details" button in the marketplace to add your bank account. You cannot receive payments from buyers without it!');
        }, 500);
      }
      
      // Reset form
      setTitle(''); setDescription(''); setPrice(''); setCityName(''); setCategory(''); setSelectedImage(null);
      setIsNegotiable(true);
    } catch (err) {
      console.error(err);
      alert('Failed to post ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering Logic
  const myItemsCount = user ? items.filter(i => i.sellerId === user.id).length : 0;

  const filteredItems = items.filter(item => {
    // Tab filter
    if (activeTab === 'my_ads') {
      if (!user || item.sellerId !== user.id) return false;
    } else {
      // In 'all' tab, only show active items
      if (item.status !== 'active') return false;
    }

    // State filter (Jiji-style integrated dropdown)
    if (selectedState !== 'All Nigeria' && item.state.toLowerCase() !== selectedState.toLowerCase()) {
      return false;
    }

    // Category filter
    const matchesCategory = selectedCategory === 'All' || 
      item.category.toLowerCase().includes(selectedCategory.toLowerCase()) || 
      selectedCategory.toLowerCase().includes(item.category.toLowerCase());
    if (!matchesCategory) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Store className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                9jaKonet Marketplace
              </h1>
            </div>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Buy & sell second-hand or brand-new goods safely with built-in Nigerian Escrow protection.
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300 shadow-xs">
              🔥 LAUNCH PROMO: UNLIMITED FREE LISTINGS UNTIL NOV 1ST
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {user && (
              <Button 
                onClick={() => navigate('/wallet')} 
                variant="outline" 
                className="h-11 px-4 text-xs sm:text-sm font-semibold border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
              >
                Bank Details
              </Button>
            )}
            <Button 
              onClick={() => user ? setIsPosting(true) : navigate('/login')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 shadow-sm rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post Free Ad
            </Button>
          </div>
        </div>

        {/* Jiji-Inspired "Make Money & Trust" Onboarding Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white mb-6 shadow-md border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              🔥 LAUNCH PROMO: UNLIMITED FREE LISTINGS UNTIL NOV 1ST
            </div>
            <p className="text-sm sm:text-base font-semibold text-white">
              Got used phones, electronics, furniture, or clothes? Sell to real verified buyers near you.
            </p>
            <p className="text-xs text-emerald-200/90 flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              100% Escrow Protection: Buyers' funds are securely held until items are delivered.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowSafetyGuide(true)}
              className="flex-1 md:flex-initial text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition-colors border border-white/20"
            >
              How Escrow Protects You
            </button>
            <Button
              onClick={() => user ? setIsPosting(true) : navigate('/login')}
              size="sm"
              className="flex-1 md:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
            >
              Start Selling
            </Button>
          </div>
        </div>

        {/* Jiji-Style Search Bar (Location Dropdown + Search Input) */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            {/* Integrated State Selector */}
            <div className="relative min-w-[160px] sm:min-w-[190px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                <MapPin className="w-4 h-4" />
              </div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full h-12 pl-9 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="All Nigeria">All Nigeria (Every State)</option>
                {states.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Keyword Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <Input 
                placeholder="Search for Toyota, iPhone, generator, sofa, shoes..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-10 bg-slate-50 border-slate-200 text-sm rounded-xl focus:bg-white transition-colors"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {visualCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name 
                    ? 'bg-emerald-600 text-white shadow-sm border-emerald-600' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
                } border`}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Informational Guide Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs border-t border-slate-100">
            <span className="text-slate-400 font-medium">Quick links:</span>
            <button 
              onClick={() => setShowSafetyGuide(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Escrow Protection
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <Wrench className="w-3.5 h-3.5 text-slate-600" />
              Need a Repair Artisan?
            </button>
            <button 
              onClick={() => { setSelectedState('All Nigeria'); setSelectedCategory('All'); setSearch(''); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Feed Tabs: All Listings vs My Adverts */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm sm:text-base font-bold pb-2 relative transition-colors ${
                activeTab === 'all' 
                  ? 'text-emerald-700' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Items ({items.filter(i => i.status === 'active').length})
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('my_ads')}
                className={`text-sm sm:text-base font-bold pb-2 relative transition-colors ${
                  activeTab === 'my_ads' 
                    ? 'text-emerald-700' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Adverts ({myItemsCount})
                {activeTab === 'my_ads' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading marketplace items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
            <Store className="w-14 h-14 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No items found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              {activeTab === 'my_ads' 
                ? "You haven't posted any adverts yet."
                : "No matching items for this location or category. Try clearing your search!"}
            </p>
            <div className="flex justify-center gap-3">
              {activeTab === 'my_ads' ? (
                <Button onClick={() => setIsPosting(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Post Your First Ad
                </Button>
              ) : (
                <Button 
                  onClick={() => { setSelectedState('All Nigeria'); setSelectedCategory('All'); setSearch(''); }} 
                  variant="outline"
                >
                  View All Nigeria
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-lg transition-all border-slate-200 group flex flex-col cursor-pointer bg-white rounded-2xl"
                onClick={() => setSelectedDetailItem(item)}
              >
                {/* Product Image + Badges */}
                <div className="relative h-40 sm:h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Status: Sold vs Just Listed */}
                  {item.status === 'sold' ? (
                    <div className="absolute top-2 left-2 bg-red-600/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold text-white tracking-wide shadow-sm">
                      SOLD
                    </div>
                  ) : (Date.now() - item.createdAt) < (24 * 60 * 60 * 1000) ? (
                    <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold text-white tracking-wide shadow-sm">
                      Just listed
                    </div>
                  ) : null}

                  {/* Condition Badge (Jiji Style: Tokunbo, Nigerian Used, New) */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold shadow-xs border ${getConditionColor(item.condition)}`}>
                    {getConditionLabel(item.condition)}
                  </div>
                </div>

                {/* Card Content */}
                <CardContent className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-2 text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors mb-1.5">
                      {item.title}
                    </h3>

                    {/* Price & Negotiable Badge (Jiji Style) */}
                    <div className="flex flex-wrap items-baseline gap-1.5 mb-2">
                      <p className="text-base sm:text-lg font-extrabold text-emerald-700">
                        ₦{item.price.toLocaleString()}
                      </p>
                      {item.isNegotiable !== false && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          Negotiable
                        </span>
                      )}
                    </div>
                    
                    {/* Location & Category */}
                    <div className="space-y-1 text-[11px] sm:text-xs text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.city || item.state}, {item.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-2.5 border-t border-slate-100 mt-auto">
                    {user?.id === item.sellerId ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleSoldStatus(item)}
                          className="flex-1 text-[11px] h-8 font-semibold border-slate-200"
                        >
                          {item.status === 'sold' ? 'Mark Active' : 'Mark Sold'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAd(item.id, item.sellerId)}
                          className="h-8 px-2 text-red-600 hover:bg-red-50 border-red-200"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="text-[11px] text-slate-500 truncate mr-1">
                          {item.sellerName?.split(' ')[0] || 'Seller'}
                        </span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleMessageSeller(item.sellerId)}
                            className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Chat with Seller"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {item.sellerPhone && (
                            <a 
                              href={`tel:${item.sellerPhone}`} 
                              className="inline-flex items-center justify-center p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                              title="Call Seller"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => user ? setCheckoutItem(item) : navigate('/login')}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] h-8 px-2.5 rounded-lg flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Escrow
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Jiji-Inspired Item Detail Modal (Screenshot 5) */}
      {selectedDetailItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {selectedDetailItem.category} in {selectedDetailItem.state}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                  title="Share Item"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setSelectedDetailItem(null)} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Main Image */}
              <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-4/3 sm:aspect-16/9 max-h-80 w-full">
                <img 
                  src={selectedDetailItem.images[0] || 'https://via.placeholder.com/600x400?text=No+Image'} 
                  alt={selectedDetailItem.title} 
                  className="w-full h-full object-contain bg-slate-900/5"
                />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-bold shadow-md border ${getConditionColor(selectedDetailItem.condition)}`}>
                  {getConditionLabel(selectedDetailItem.condition)}
                </div>
                {selectedDetailItem.status === 'sold' && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-lg shadow-md">
                    ITEM SOLD
                  </div>
                )}
              </div>

              {/* Title, Price, Badges */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  {selectedDetailItem.title}
                </h2>
                
                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                    ₦{selectedDetailItem.price.toLocaleString()}
                  </span>
                  {selectedDetailItem.isNegotiable !== false ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      Negotiable Price
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Fixed Price
                    </span>
                  )}
                </div>

                {/* Key Spec Chips */}
                <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedDetailItem.city}, {selectedDetailItem.state}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedDetailItem.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <Store className="w-3.5 h-3.5 text-slate-500" />
                    <span>Seller: {selectedDetailItem.sellerName}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Item Description</h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedDetailItem.description || 'No additional description provided.'}
                </p>
              </div>

              {/* 9jaKonet Escrow Protection Notice */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
                <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <p className="font-bold text-sm">Protected by 9jaKonet Escrow</p>
                  <p className="text-emerald-800 leading-relaxed">
                    Never pay direct cash or private bank transfer to strangers! Click <strong>"Buy with Escrow"</strong>. 9jaKonet holds your funds in escrow and only releases them when you inspect and confirm delivery.
                  </p>
                </div>
              </div>

              {/* Jiji-Style Quick Bargain / Chat Box (Screenshot 5) */}
              {user?.id !== selectedDetailItem.sellerId && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Quick Chat with Seller:</span>
                    <span className="text-[11px] text-slate-500">Tap to start message</span>
                  </div>

                  {/* Pre-canned Quick Chips */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleMessageSeller(selectedDetailItem.sellerId, `Hi ${selectedDetailItem.sellerName}, is "${selectedDetailItem.title}" still available?`)}
                      className="text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Is this available?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMessageSeller(selectedDetailItem.sellerId, `Hi, what is the last price for "${selectedDetailItem.title}"?`)}
                      className="text-xs font-medium bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Last price?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMessageSeller(selectedDetailItem.sellerId, `Hello, I'd like to make an offer for "${selectedDetailItem.title}".`)}
                      className="text-xs font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Make an offer
                    </button>
                  </div>

                  {/* Custom inline message input */}
                  <div className="flex gap-2 pt-1">
                    <Input 
                      placeholder="Type a custom message..." 
                      value={quickMessageText}
                      onChange={e => setQuickMessageText(e.target.value)}
                      className="h-10 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && quickMessageText.trim()) {
                          handleMessageSeller(selectedDetailItem.sellerId, quickMessageText.trim());
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleMessageSeller(selectedDetailItem.sellerId, quickMessageText.trim() || `Hi, I am interested in ${selectedDetailItem.title}`)}
                      disabled={isSendingMessage}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 font-bold text-xs"
                    >
                      {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                      Send
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {user?.id !== selectedDetailItem.sellerId ? (
                  <>
                    <Button
                      onClick={() => user ? setCheckoutItem(selectedDetailItem) : navigate('/login')}
                      className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-md"
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Buy with Escrow (₦{selectedDetailItem.price.toLocaleString()})
                    </Button>

                    {selectedDetailItem.sellerPhone && (
                      <a
                        href={`tel:${selectedDetailItem.sellerPhone}`}
                        className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call Seller
                      </a>
                    )}
                  </>
                ) : (
                  <div className="w-full flex gap-3">
                    <Button
                      onClick={() => handleToggleSoldStatus(selectedDetailItem)}
                      variant="outline"
                      className="flex-1 h-12 font-bold text-sm"
                    >
                      {selectedDetailItem.status === 'sold' ? 'Mark as Active' : 'Mark as Sold'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteAd(selectedDetailItem.id, selectedDetailItem.sellerId)}
                      variant="outline"
                      className="h-12 px-5 text-red-600 hover:bg-red-50 border-red-200 font-bold text-sm flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Ad
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety & Escrow Guide Modal */}
      {showSafetyGuide && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowSafetyGuide(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">How Escrow Protects You</h3>
                <p className="text-xs text-slate-500">Shop without fear of fake items or scams</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <p><strong>You Click "Buy with Escrow":</strong> Pay securely with card or transfer via Paystack. Your money is placed in 9jaKonet Vault, NOT sent to the seller.</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <p><strong>Seller Delivers Item:</strong> The seller dispatches or brings the item to your agreed delivery address.</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <p><strong>You Inspect & Confirm:</strong> Once satisfied with condition, you tap "Release Payment" in your Escrow Dashboard. If the item is faulty, you get your full refund!</p>
              </div>
            </div>

            <Button
              onClick={() => setShowSafetyGuide(false)}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs"
            >
              Got it, thanks!
            </Button>
          </div>
        </div>
      )}

      {/* Post Ad Modal (with Condition & Negotiable option) */}
      {isPosting && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">Post an Ad</h2>
              <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePostAd} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs font-medium flex gap-3 items-center">
                <span className="text-base">🔥</span>
                <p><strong>Launch Promo:</strong> Posting ads on 9jaKonet Marketplace is 100% FREE right now! You can post an unlimited amount of items until Nov 1st.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <Input 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. iPhone 13 Pro Max (128GB) or Toyota Corolla 2008" 
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₦)</label>
                  <Input 
                    type="number" 
                    required 
                    min="0" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    placeholder="0.00" 
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                  <select 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="new">Brand New</option>
                    <option value="tokunbo">Foreign Used (Tokunbo)</option>
                    <option value="nigerian_used">Nigerian Used</option>
                  </select>
                </div>
              </div>

              {/* Price Negotiable Toggle */}
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="negotiable-checkbox"
                  checked={isNegotiable}
                  onChange={e => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="negotiable-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Price is negotiable (buyers can make bargaining offers)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input 
                    type="text"
                    list="categories-list"
                    required
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Select category..."
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="categories-list">
                    {defaultCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <select 
                    value={stateName} 
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Exact Neighborhood</label>
                <div className="flex gap-2">
                  <Input 
                    required 
                    value={cityName} 
                    onChange={e => setCityName(e.target.value)} 
                    placeholder="e.g. Ikeja, Wuse II, Lekki Phase 1..." 
                    className="flex-1 text-xs"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGetLocation} 
                    disabled={isLocating}
                    title="Get My Location"
                    className="px-3"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Navigation className="w-4 h-4 text-emerald-600" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe key specs, accessories included, or condition..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-sm font-bold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting Ad...
                  </>
                ) : 'Post Ad for Free'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Checkout with Escrow Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button onClick={() => setCheckoutItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Secure Escrow Checkout</h2>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-1">{checkoutItem.title}</h3>
              <p className="text-xl font-extrabold text-emerald-700">₦{checkoutItem.price.toLocaleString()}</p>
              <div className="mt-1 text-xs text-slate-500">Seller: {checkoutItem.sellerName} ({checkoutItem.city}, {checkoutItem.state})</div>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Delivery Address</label>
                <Input required value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="House number, street name, area..." className="text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Phone Number</label>
                <Input required value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="080... or 090..." className="text-xs" />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs mb-5 flex gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
              <p>Your money is locked safely in Escrow. The seller does NOT receive payout until you physically receive and verify the item.</p>
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
                className={`w-full h-12 rounded-xl font-bold text-white transition-colors ${(!deliveryAddress || !buyerPhone) ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-md'}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

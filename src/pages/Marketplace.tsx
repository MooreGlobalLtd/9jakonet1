import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, deleteDoc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { MarketplaceItem } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { uploadToCloudinary, uploadVideoToCloudinary } from '../lib/cloudinary';
import { 
  Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, 
  ShoppingBag, ShieldCheck, Car, Smartphone, Laptop, Sofa, Shirt, Home, 
  MoreHorizontal, Trash2, Search, CheckCircle2, Share2, Send, HelpCircle, 
  Sparkles, Wrench, ChevronRight, Check, Flame, Video, Play, Bell
} from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { useNavigate } from 'react-router-dom';
import { SEED_MARKETPLACE_ITEMS } from '../data/seedMarketplaceItems';
import BookInspectionModal, { getRecommendedTradeForItem, POPULAR_INSPECTION_TRADES } from '../components/marketplace/BookInspectionModal';
import { formatWhatsAppUrl, sendInAppNotification, requestBrowserNotificationPermission } from '../lib/notifications';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'sold' | 'distress' | 'my_ads'>('all');

  // Modals & Detailed Views
  const [selectedDetailItem, setSelectedDetailItem] = useState<MarketplaceItem | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mediaTab, setMediaTab] = useState<'photo' | 'video'>('photo');

  // Artisan Inspection Bridge Modal State
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionTargetItem, setInspectionTargetItem] = useState<MarketplaceItem | null>(null);

  // Push Notification Prompt State
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false
  );

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
  const [isSeeding, setIsSeeding] = useState(false);

  // Seeder Dialog State (Custom In-App UI - immune to iframe confirm/alert blocking)
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);
  const [seedErrorMsg, setSeedErrorMsg] = useState<string | null>(null);

  // Helper to check if current user is the owner or an admin
  const canManageItem = (sellerId?: string) => {
    if (!user) return false;
    return (
      user.id === sellerId ||
      user.role === 'admin' ||
      user.email === 'ayorindesamuel705@gmail.com' ||
      user.email === 'support@9jakonet.com' ||
      user.email === 'info@mooregloballtd.online'
    );
  };

  const handleEnableNotifications = async () => {
    const granted = await requestBrowserNotificationPermission();
    setHasNotificationPermission(granted);
    if (granted) {
      toast.success('Instant alerts activated! You will receive live notifications for buyer inquiries.');
    }
  };

  // Helper to seed 30 starter items with live progress and admin ownership
  const handleExecuteSeed = async (clearExisting: boolean = false) => {
    if (!user) {
      setSeedErrorMsg('Please log in with your admin account (ayorindesamuel705@gmail.com) to seed items.');
      return;
    }

    setIsSeeding(true);
    setSeedErrorMsg(null);
    setSeedSuccessMsg(null);
    setSeedProgress({ current: 0, total: SEED_MARKETPLACE_ITEMS.length, title: 'Initializing...' });

    try {
      if (clearExisting && items.length > 0) {
        setSeedProgress({ current: 0, total: SEED_MARKETPLACE_ITEMS.length, title: 'Clearing previous listings...' });
        for (const itm of items) {
          try {
            await deleteDoc(doc(db, 'marketplace_items', itm.id));
          } catch (delErr) {
            console.warn('Could not delete item:', itm.id, delErr);
          }
        }
      }

      let count = 0;
      for (const sample of SEED_MARKETPLACE_ITEMS) {
        count++;
        setSeedProgress({
          current: count,
          total: SEED_MARKETPLACE_ITEMS.length,
          title: sample.title
        });

        await addDoc(collection(db, 'marketplace_items'), {
          ...sample,
          sellerId: user.id, // assigned directly to current logged-in admin so you can mark as sold/active with 1 click
          sellerName: sample.sellerName,
          sellerPhone: sample.sellerPhone,
          whatsappNumber: sample.whatsappNumber || sample.sellerPhone,
          isDistressSale: sample.isDistressSale || false,
          distressReason: sample.distressReason || '',
          videoUrl: sample.videoUrl || '',
          recommendedArtisanTrade: sample.recommendedArtisanTrade || '',
          createdAt: Date.now() - (count * 1000 * 60 * 35)
        });
      }

      setSeedSuccessMsg(`Successfully added ${SEED_MARKETPLACE_ITEMS.length} marketplace listings! All listings are now active in the database and linked to your controls.`);
      setTimeout(() => {
        setShowSeedDialog(false);
        setSeedProgress(null);
      }, 2500);
    } catch (e: any) {
      console.error('Failed to seed starter items:', e);
      setSeedErrorMsg(e?.message || 'Error adding sample listings. Please check your connection.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<string>('tokunbo');
  const [stateName, setStateName] = useState('Lagos');
  const [cityName, setCityName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // New Post Ad Inputs: Distress sale, WhatsApp, Video, Artisan Trade
  const [isDistressSale, setIsDistressSale] = useState(false);
  const [distressReason, setDistressReason] = useState('Relocating abroad (Japa Sale)');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [whatsappNumberInput, setWhatsappNumberInput] = useState('');
  const [recommendedTradeInput, setRecommendedTradeInput] = useState('');

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
    if (!canManageItem(sellerId)) return;
    if (!confirm('Are you sure you want to delete this listing?')) return;
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
    if (!canManageItem(item.sellerId)) return;
    const newStatus: 'active' | 'sold' = item.status === 'sold' ? 'active' : 'sold';
    const now = Date.now();

    // Optimistic UI update so the change is instantly reflected
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus, soldAt: newStatus === 'sold' ? now : undefined } : i));
    if (selectedDetailItem?.id === item.id) {
      setSelectedDetailItem({ ...selectedDetailItem, status: newStatus, soldAt: newStatus === 'sold' ? now : undefined });
    }

    try {
      await updateDoc(doc(db, 'marketplace_items', item.id), { 
        status: newStatus,
        soldAt: newStatus === 'sold' ? now : null
      });
      if (newStatus === 'sold') {
        toast.success(`"${item.title.substring(0, 26)}..." marked as SOLD! It stays visible on the feed with a prominent SOLD badge.`);
      } else {
        toast.success(`"${item.title.substring(0, 26)}..." reactivated as Active!`);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      // Revert optimistic update on failure
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
      if (selectedDetailItem?.id === item.id) {
        setSelectedDetailItem(item);
      }
      toast.error('Failed to update status: ' + (err?.message || 'Error occurred'));
    }
  };

  // Message Seller with Pre-canned Quick Chips (Jiji Style)
  const handleMessageSeller = async (sellerId: string, customText?: string) => {
    if (!user) return navigate('/login');
    if (user.id === sellerId) {
      toast.error('You cannot message yourself.');
      return;
    }
    
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

      // Send instant push & in-app notification to the seller
      await sendInAppNotification({
        userId: sellerId,
        title: `Marketplace Inquiry from ${user.displayName || 'Buyer'}`,
        body: customText || `Hello, I'm interested in your marketplace item.`,
        link: `/messages?chat=${targetChatId}`,
        type: 'message'
      });

      toast.success('Inquiry sent! Seller received real-time notification.');
      setIsSendingMessage(false);
      setSelectedDetailItem(null);
      navigate(`/messages?chat=${targetChatId}`);
    } catch (e) {
      console.error(e);
      setIsSendingMessage(false);
      toast.error('Failed to start chat.');
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
    if (!selectedImage) {
      toast.error('Please select at least one photo.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userPhone = userDoc.exists() ? userDoc.data().phone || '' : '';

      const imageUrl = await uploadToCloudinary(selectedImage);

      // Handle optional 10-second inspection video
      let finalVideoUrl = videoUrlInput.trim();
      if (selectedVideoFile) {
        try {
          finalVideoUrl = await uploadVideoToCloudinary(selectedVideoFile);
        } catch (vidErr) {
          console.warn('Video upload error:', vidErr);
          toast.error('Video upload failed, continuing with photo listing.');
        }
      }
      
      const newItem: Omit<MarketplaceItem, 'id'> = {
        sellerId: user.id,
        sellerName: user.displayName,
        sellerPhone: userPhone,
        whatsappNumber: whatsappNumberInput.trim() || userPhone,
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
        isDistressSale: isDistressSale,
        distressReason: isDistressSale ? distressReason : undefined,
        videoUrl: finalVideoUrl || undefined,
        recommendedArtisanTrade: recommendedTradeInput.trim() || undefined,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'marketplace_items'), newItem);
      setIsPosting(false);
      toast.success('Your ad has been posted live on 9jaKonet Marketplace!');
      
      // Check bank setup
      const bankName = userDoc.exists() ? userDoc.data().bankName : null;
      if (!bankName || bankName === 'Not Set' || bankName === '') {
        setTimeout(() => {
          toast.info('Item Posted! Please click "Bank Details" to set up your payout account.');
        }, 800);
      }
      
      // Reset form
      setTitle(''); setDescription(''); setPrice(''); setCityName(''); setCategory(''); setSelectedImage(null);
      setSelectedVideoFile(null); setVideoUrlInput(''); setWhatsappNumberInput('');
      setIsDistressSale(false); setRecommendedTradeInput('');
      setIsNegotiable(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to post ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering Logic
  const totalCount = items.length;
  const activeCount = items.filter(i => i.status === 'active').length;
  const soldCount = items.filter(i => i.status === 'sold').length;
  const distressCount = items.filter(i => i.isDistressSale).length;
  const myItemsCount = user ? items.filter(i => i.sellerId === user.id).length : 0;

  const filteredItems = items.filter(item => {
    // Tab filter
    if (activeTab === 'my_ads') {
      if (!user || item.sellerId !== user.id) return false;
    } else if (activeTab === 'available') {
      // Only show unsold active listings
      if (item.status !== 'active') return false;
    } else if (activeTab === 'sold') {
      // Specifically show sold items archive
      if (item.status !== 'sold') return false;
    } else if (activeTab === 'distress') {
      if (!item.isDistressSale) return false;
    } else {
      // In 'all' tab: keep ALL items (both active and sold) visible!
      // Sold items stay on the marketplace with clear SOLD badges for buyers to see sales history.
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
            {canManageItem() && (
              <Button 
                onClick={() => setShowSeedDialog(true)}
                disabled={isSeeding}
                variant="outline"
                className="h-11 px-3.5 text-xs font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-1.5"
                title="Populate 30 realistic Nigerian marketplace deals"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Seed 30 Deals
              </Button>
            )}
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

        {/* Push Notification Banner */}
        {!hasNotificationPermission && typeof Notification !== 'undefined' && Notification.permission === 'default' && (
          <div className="mb-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-950">Never Miss a Buyer or Bargain Offer</p>
                <p className="text-[11px] sm:text-xs text-emerald-800">Enable real-time push alerts for instant marketplace messages, inspection requests, and offers.</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleEnableNotifications}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0 shadow-xs"
            >
              Enable Instant Alerts
            </Button>
          </div>
        )}

        {/* Feed Tabs: All Listings vs Available vs Sold Archive vs Distress Sales vs My Adverts */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 mb-6 gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm sm:text-base font-bold pb-2 relative transition-colors ${
                activeTab === 'all' 
                  ? 'text-emerald-700' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Items ({totalCount})
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>

            {/* Available Only Tab */}
            <button
              onClick={() => setActiveTab('available')}
              className={`text-sm sm:text-base font-bold pb-2 relative transition-colors ${
                activeTab === 'available' 
                  ? 'text-emerald-700' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Available ({activeCount})
              {activeTab === 'available' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>

            {/* Sold Archive Tab */}
            <button
              onClick={() => setActiveTab('sold')}
              className={`text-sm sm:text-base font-bold pb-2 relative transition-colors flex items-center gap-1.5 ${
                activeTab === 'sold' 
                  ? 'text-red-700' 
                  : 'text-slate-500 hover:text-red-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-red-500" />
              <span>Sold ({soldCount})</span>
              {activeTab === 'sold' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
              )}
            </button>

            {/* Distress / Relocation Sales Tab */}
            <button
              onClick={() => setActiveTab('distress')}
              className={`text-sm sm:text-base font-bold pb-2 relative transition-colors flex items-center gap-1.5 ${
                activeTab === 'distress' 
                  ? 'text-red-700' 
                  : 'text-slate-500 hover:text-red-600'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span>Distress Sales ({distressCount})</span>
              {activeTab === 'distress' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
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
          <div className="text-center py-14 px-5 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
            {activeTab === 'my_ads' ? (
              <>
                <Store className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-800">You haven't posted any adverts yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-5">
                  Turn unused household items, phones, cars, or gadgets into instant cash! Free until Nov 1st.
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => setIsPosting(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Post Your First Ad
                  </Button>
                </div>
              </>
            ) : items.length === 0 ? (
              <>
                <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3.5 shadow-xs">
                  <Store className="w-8 h-8" />
                </div>
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full mb-3 border border-amber-300">
                  🔥 LAUNCH PROMO: UNLIMITED FREE LISTINGS UNTIL NOV 1ST
                </div>
                <h3 className="text-xl font-bold text-slate-900">Be The First To Sell Here!</h3>
                <p className="text-sm text-slate-600 mt-1.5 mb-6 leading-relaxed">
                  No adverts have been posted in the marketplace yet. Be among the first sellers to list phones, generators, electronics, cars, or fashion!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button 
                    onClick={() => user ? setIsPosting(true) : navigate('/login')} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Post Your Ad (100% Free)
                  </Button>
                  <Button 
                    onClick={() => setShowSeedDialog(true)}
                    disabled={isSeeding}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold h-11 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Populate 30 Sample Deals (Demo)
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedState !== 'All Nigeria' ? `No items found in ${selectedState}` : 'No matching items'}
                </h3>
                <p className="text-sm text-slate-500 mt-1.5 mb-5">
                  There are no items matching this search in {selectedState}. We have {items.length} {items.length === 1 ? 'item' : 'items'} available across Nigeria!
                </p>
                <Button 
                  onClick={() => { setSelectedState('All Nigeria'); setSelectedCategory('All'); setSearch(''); }} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  View All {items.length} Items Across Nigeria
                </Button>
              </>
            )}
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
                  
                  {/* Status: Sold vs Distress vs Just Listed */}
                  {item.status === 'sold' ? (
                    <>
                      <div className="absolute top-2 left-2 bg-red-600/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black text-white tracking-wide shadow-md flex items-center gap-1 z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>SOLD</span>
                      </div>
                      <div className="absolute inset-0 bg-slate-950/25 pointer-events-none flex items-center justify-center z-10">
                        <span className="bg-red-600/95 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-lg shadow-xl tracking-wider uppercase -rotate-6 border border-white/50">
                          SOLD OUT
                        </span>
                      </div>
                    </>
                  ) : item.isDistressSale ? (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-amber-600 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black text-white tracking-wide shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3 text-yellow-200" />
                      <span>DISTRESS</span>
                    </div>
                  ) : (Date.now() - item.createdAt) < (24 * 60 * 60 * 1000) ? (
                    <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold text-white tracking-wide shadow-sm">
                      Just listed
                    </div>
                  ) : null}

                  {/* 10-Second Video Clip Badge */}
                  {item.videoUrl && (
                    <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Play className="w-2.5 h-2.5 fill-current text-emerald-400" />
                      <span>10s Video</span>
                    </div>
                  )}

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
                      <p className={`text-base sm:text-lg font-extrabold ${item.status === 'sold' ? 'text-slate-500 line-through' : 'text-emerald-700'}`}>
                        ₦{item.price.toLocaleString()}
                      </p>
                      {item.status === 'sold' ? (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                          Sold
                        </span>
                      ) : item.isNegotiable !== false ? (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          Negotiable
                        </span>
                      ) : null}
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
                    {canManageItem(item.sellerId) ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleSoldStatus(item)}
                          className={`flex-1 text-[11px] h-8 font-bold border transition-colors ${
                            item.status === 'sold' 
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100' 
                              : 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {item.status === 'sold' ? '✓ Reactivate Ad' : 'Mark Sold'}
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
                    ) : item.status === 'sold' ? (
                      <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="text-[11px] text-slate-500 truncate mr-1">
                          {item.sellerName?.split(' ')[0] || 'Seller'}
                        </span>
                        <span className="text-[10px] font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
                          SOLD OUT
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="text-[11px] text-slate-500 truncate mr-1">
                          {item.sellerName?.split(' ')[0] || 'Seller'}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Artisan Inspection Bridge */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectionTargetItem(item);
                              setShowInspectionModal(true);
                            }}
                            className="inline-flex items-center justify-center p-1.5 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                            title="Book Artisan to Inspect Item"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Direct Inquiry */}
                          {(() => {
                            const waUrl = formatWhatsAppUrl(
                              item.whatsappNumber || item.sellerPhone,
                              `Hello! I saw your "${item.title}" listed on 9jaKonet for ₦${item.price.toLocaleString()} in ${item.city}, ${item.state}. Is it still available?`
                            );
                            if (!waUrl) return null;
                            return (
                              <a 
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            );
                          })()}

                          {/* In-App Chat */}
                          <button 
                            onClick={() => handleMessageSeller(item.sellerId)}
                            className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Chat with Seller"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Buy with Escrow */}
                          <Button 
                            size="sm"
                            onClick={() => user ? setCheckoutItem(item) : navigate('/login')}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] h-8 px-2 rounded-lg flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
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
              {/* Media Switcher Tab (if video clip exists) */}
              {selectedDetailItem.videoUrl && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaTab('photo')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      mediaTab === 'photo' 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📷 Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab('video')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      mediaTab === 'video' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    🎥 10-Second Inspection Clip
                  </button>
                </div>
              )}

              {/* Main Media Display */}
              {mediaTab === 'video' && selectedDetailItem.videoUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 sm:aspect-16/9 max-h-80 w-full flex items-center justify-center">
                  <video 
                    controls 
                    autoPlay 
                    muted 
                    playsInline 
                    src={selectedDetailItem.videoUrl} 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Play className="w-3 h-3 text-emerald-400 fill-current" />
                    <span>Inspection Video Clip</span>
                  </div>
                </div>
              ) : (
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
              )}

              {/* Urgent Distress / Relocation Sale Banner */}
              {selectedDetailItem.isDistressSale && (
                <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white p-3.5 rounded-xl shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                        <span>Urgent Distress / Relocation Sale</span>
                      </p>
                      <p className="text-xs text-amber-100 font-medium">
                        {selectedDetailItem.distressReason || 'Seller is relocating or requires fast cash clearance.'}
                      </p>
                    </div>
                  </div>
                  <span className="bg-white/25 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 uppercase tracking-wider">
                    Priced to Go
                  </span>
                </div>
              )}

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

              {/* Artisan Bridge: Book an Artisan to Inspect / Install This Item */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/20 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                      Book an Artisan to Inspect / Install This Item
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Need a verified <strong>9jaKonet {getRecommendedTradeForItem(selectedDetailItem)}</strong> in {selectedDetailItem.state} to inspect engine/electricals, verify genuine parts, or install this for you before payment?
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setInspectionTargetItem(selectedDetailItem);
                    setShowInspectionModal(true);
                  }}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-4 rounded-xl shrink-0 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Book Inspection
                </Button>
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
              <div className="pt-2 flex flex-col gap-3">
                {/* Admin/Owner Quick Controls */}
                {canManageItem(selectedDetailItem.sellerId) && (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Item Management:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${selectedDetailItem.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {selectedDetailItem.status === 'sold' ? 'Sold' : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleToggleSoldStatus(selectedDetailItem)}
                        variant="outline"
                        className={`h-8 font-bold text-xs ${selectedDetailItem.status === 'sold' ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-amber-900 bg-amber-50 border-amber-300'}`}
                      >
                        {selectedDetailItem.status === 'sold' ? '✓ Mark as Active' : 'Mark as Sold'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteAd(selectedDetailItem.id, selectedDetailItem.sellerId)}
                        variant="outline"
                        className="h-8 px-2.5 text-red-600 hover:bg-red-50 border-red-200 font-bold text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}

                {/* Buyer Actions or Sold Banner */}
                {selectedDetailItem.status === 'sold' ? (
                  <div className="w-full py-3.5 px-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold text-center text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-xs">
                    <div className="flex items-center gap-1.5 text-red-800 font-extrabold text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                      This item has been marked as SOLD
                    </div>
                    <p className="text-xs text-red-600 font-normal">
                      This listing has already been sold and is displayed on 9jaKonet for price transparency and reference.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                    <Button
                      onClick={() => user ? setCheckoutItem(selectedDetailItem) : navigate('/login')}
                      className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-md"
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Buy with Escrow (₦{selectedDetailItem.price.toLocaleString()})
                    </Button>

                    {/* WhatsApp Direct Chat Button */}
                    {(() => {
                      const waUrl = formatWhatsAppUrl(
                        selectedDetailItem.whatsappNumber || selectedDetailItem.sellerPhone,
                        `Hello! I saw your "${selectedDetailItem.title}" listed on 9jaKonet for ₦${selectedDetailItem.price.toLocaleString()} in ${selectedDetailItem.city}, ${selectedDetailItem.state}. Is it still available?`
                      );
                      if (!waUrl) return null;
                      return (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat on WhatsApp
                        </a>
                      );
                    })()}

                    {selectedDetailItem.sellerPhone && (
                      <a
                        href={`tel:${selectedDetailItem.sellerPhone}`}
                        className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call Seller
                      </a>
                    )}
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

              {/* Urgent Distress / Relocation Sale Section */}
              <div className="p-3.5 bg-gradient-to-r from-red-50/70 to-orange-50/70 rounded-xl border border-red-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    <label htmlFor="distress-checkbox" className="text-xs font-bold text-slate-900 cursor-pointer">
                      Tag as Urgent Distress / Relocation Sale
                    </label>
                  </div>
                  <input
                    type="checkbox"
                    id="distress-checkbox"
                    checked={isDistressSale}
                    onChange={e => setIsDistressSale(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-slate-300 cursor-pointer"
                  />
                </div>
                {isDistressSale && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason for Quick Sale</label>
                    <select
                      value={distressReason}
                      onChange={e => setDistressReason(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-red-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Relocating abroad (Japa Sale)">Relocating abroad (Japa Sale)</option>
                      <option value="Relocating to another state">Relocating to another state</option>
                      <option value="Urgent cash clearance / Moving out">Urgent cash clearance / Moving out</option>
                      <option value="Office / Shop closing down liquidation">Office / Shop closing down liquidation</option>
                    </select>
                  </div>
                )}
              </div>

              {/* WhatsApp Direct Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Direct Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <Input
                    type="tel"
                    value={whatsappNumberInput}
                    onChange={e => setWhatsappNumberInput(e.target.value)}
                    placeholder="e.g. 08012345678 (enables instant WhatsApp buyer chats)"
                    className="text-xs pl-9"
                  />
                </div>
              </div>

              {/* 10-Second Video Inspection Clip Upload */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-bold text-slate-800">
                    10-Second Video Inspection Clip (Optional)
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload a brief 10-second video of the car engine running, phone screen functioning, or gadget powering on. Boosts buyer trust by 80%!
                </p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => setSelectedVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
                />
              </div>

              {/* Artisan Pre-Purchase Inspection Recommendation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommended Artisan Trade for Inspection (Optional)
                </label>
                <select
                  value={recommendedTradeInput}
                  onChange={e => setRecommendedTradeInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Auto-detect from Category</option>
                  {POPULAR_INSPECTION_TRADES.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pairs buyers with a verified 9jaKonet artisan (e.g. auto mechanic, AC technician) to inspect before final payment.
                </p>
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

      {/* 30 Marketplace Items Seeder Modal (In-App UI, immune to iframe popup blocking) */}
      {showSeedDialog && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-slate-200">
            <button 
              onClick={() => { if (!isSeeding) setShowSeedDialog(false); }} 
              disabled={isSeeding}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-40 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Populate 30 Marketplace Deals</h3>
                <p className="text-xs text-slate-500">Live camouflage deals with realistic Nigerian specs & prices</p>
              </div>
            </div>

            {!user ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-1.5">
                  <p className="font-bold text-sm">Please Log In First</p>
                  <p>You need to be signed in to add deals to the live Firestore database. Log in with your admin account (<strong>ayorindesamuel705@gmail.com</strong>) to manage and toggle them as Sold/Active.</p>
                </div>
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs"
                >
                  Log In Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  This will populate <strong>30 popular Nigerian listings</strong> across Phones, Laptops, Generators, Solar Systems, Cars, Appliances, Sofas, Industrial Machines, and Fashion. 
                  All items are directly linked to your account so you can mark them as <strong>Sold</strong> or <strong>Active</strong> with one click.
                </p>

                {items.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Current marketplace listings:</span>
                    <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {items.length} items
                    </span>
                  </div>
                )}

                {/* Progress Bar during seeding */}
                {isSeeding && seedProgress && (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                        Adding deal {seedProgress.current} of {seedProgress.total}...
                      </span>
                      <span>{Math.round((seedProgress.current / seedProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full transition-all duration-150 rounded-full" 
                        style={{ width: `${Math.max(5, (seedProgress.current / seedProgress.total) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-amber-800 truncate font-medium">
                      {seedProgress.title}
                    </p>
                  </div>
                )}

                {seedSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{seedSuccessMsg}</span>
                  </div>
                )}

                {seedErrorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
                    {seedErrorMsg}
                  </div>
                )}

                {!isSeeding && !seedSuccessMsg && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <Button
                      onClick={() => handleExecuteSeed(false)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      Add 30 Deals (Append)
                    </Button>
                    {items.length > 0 && (
                      <Button
                        onClick={() => handleExecuteSeed(true)}
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold h-11 rounded-xl text-xs"
                      >
                        Reset & Add 30 Deals
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Verified Artisan Inspection Modal (Bridge between Marketplace and Artisans) */}
      {showInspectionModal && inspectionTargetItem && (
        <BookInspectionModal
          isOpen={showInspectionModal}
          onClose={() => {
            setShowInspectionModal(false);
            setInspectionTargetItem(null);
          }}
          item={inspectionTargetItem}
          user={user}
        />
      )}
    </div>
  );
}

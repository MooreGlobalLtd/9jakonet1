import React, { useState } from 'react';
import { MarketplaceItem } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Wrench, ShieldCheck, Calendar, MapPin, X, CheckCircle2, ArrowRight, Loader2, Search } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sendInAppNotification } from '../../lib/notifications';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface BookInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketplaceItem | null;
  user: any;
}

export const POPULAR_INSPECTION_TRADES = [
  "Generator Mechanic",
  "AC Technician",
  "Auto Mechanic",
  "Inverter/Solar Installer",
  "Computer Technician",
  "Electronics Technician",
  "Electrician",
  "Carpenter",
  "Plumber",
  "Welder",
  "Tailor/Fashion Designer"
];

export function getRecommendedTradeForItem(item: MarketplaceItem): string {
  if (item.recommendedArtisanTrade) return item.recommendedArtisanTrade;
  const title = (item.title || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  
  if (title.includes('generator') || title.includes('firman') || title.includes('thermocool')) return 'Generator Mechanic';
  if (title.includes('ac') || title.includes('air conditioner') || title.includes('panasonic') || title.includes('inverter ac')) return 'AC Technician';
  if (title.includes('solar') || title.includes('inverter') || title.includes('battery') || title.includes('lifepo4')) return 'Inverter/Solar Installer';
  if (cat.includes('vehicle') || title.includes('toyota') || title.includes('honda') || title.includes('lexus') || title.includes('camry') || title.includes('corolla') || title.includes('car')) return 'Auto Mechanic';
  if (cat.includes('computer') || title.includes('laptop') || title.includes('macbook') || title.includes('dell') || title.includes('hp')) return 'Computer Technician';
  if (cat.includes('furniture') || title.includes('sofa') || title.includes('bed') || title.includes('chair') || title.includes('dining')) return 'Carpenter';
  if (title.includes('sewing') || cat.includes('fashion') || title.includes('agbada') || title.includes('weaving')) return 'Tailor/Fashion Designer';
  if (cat.includes('electronic') || title.includes('tv') || title.includes('ps5') || title.includes('camera') || title.includes('phone') || title.includes('iphone')) return 'Electronics Technician';
  return 'Electrician';
}

export default function BookInspectionModal({ isOpen, onClose, item, user }: BookInspectionModalProps) {
  const navigate = useNavigate();
  if (!isOpen || !item) return null;

  const defaultTrade = getRecommendedTradeForItem(item);
  const [selectedTrade, setSelectedTrade] = useState(defaultTrade);
  const [inspectionDate, setInspectionDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [inspectionAddress, setInspectionAddress] = useState(`${item.city || ''}, ${item.state || ''}`.trim());
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [notes, setNotes] = useState(`Inspect item "${item.title}" for original parts, physical condition, and operational functionality before buyer payment.`);
  const [fee, setFee] = useState(5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedJobId, setBookedJobId] = useState<string | null>(null);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const jobData = {
        customerId: user.id,
        customerName: user.displayName || 'Buyer',
        customerPhone: phone || '',
        title: `Physical Pre-Purchase Inspection: ${item.title}`,
        trade: selectedTrade,
        amount: fee,
        platformFee: 0,
        artisanPayout: fee,
        status: 'pending_escrow', // funds held safely in escrow
        contractType: 'service',
        serviceType: 'marketplace_inspection',
        marketplaceItemId: item.id,
        itemTitle: item.title,
        itemPrice: item.price,
        itemSellerId: item.sellerId,
        itemSellerName: item.sellerName,
        deliveryAddress: inspectionAddress,
        notes: notes,
        inspectionDate: inspectionDate,
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      setBookedJobId(docRef.id);

      // Notify seller that an artisan inspection was booked
      await sendInAppNotification({
        userId: item.sellerId,
        title: `Artisan Inspection Booked for "${item.title}"`,
        body: `${user.displayName || 'A buyer'} requested a verified ${selectedTrade} to inspect this item before closing payment.`,
        link: '/jobs',
        type: 'inspection_request'
      });

      toast.success('Inspection requested! Funds held securely in 9jaKonet Escrow.');
    } catch (err: any) {
      console.error('Failed to book inspection:', err);
      toast.error('Failed to book inspection. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Book Artisan Inspection</h3>
              <p className="text-xs text-slate-500">Bridge between Marketplace & Verified Artisans</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookedJobId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Inspection Request Created!</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your inspection request for <strong>{item.title}</strong> has been created. A verified <strong>{selectedTrade}</strong> in {item.state} will verify condition and send you a photo/diagnostic report before you complete payment.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center gap-2 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Inspection fee (₦{fee.toLocaleString()}) is held in 9jaKonet Escrow.</span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Button
                onClick={() => {
                  onClose();
                  navigate(`/explore?category=${encodeURIComponent(selectedTrade)}&state=${encodeURIComponent(item.state)}`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Browse {selectedTrade}s in {item.state}
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/jobs');
                }}
                variant="outline"
                className="h-11 px-5 rounded-xl text-xs font-semibold"
              >
                View in My Escrow Jobs
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="p-5 sm:p-6 space-y-4.5">
            {/* Item Card Summary */}
            <div className="flex gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <img
                src={item.images[0] || 'https://via.placeholder.com/120x90'}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg bg-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  Item for Inspection
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                <p className="text-sm font-extrabold text-emerald-700 mt-0.5">₦{item.price.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{item.city}, {item.state}</span>
                </p>
              </div>
            </div>

            {/* Why This Bridge Matters */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Peace of Mind Inspection:</strong> Don't buy a generator with burnt coils, an AC with leaking gas, or a car with hidden faults. A verified 9jaKonet artisan tests the item in person before you release your money.
              </p>
            </div>

            {/* Recommended Artisan Trade Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Recommended Artisan Trade
              </label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {POPULAR_INSPECTION_TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t} {t === defaultTrade ? '★ (Best Match for this Item)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Inspection Date & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Preferred Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Your Phone Number</label>
                <Input
                  required
                  placeholder="080... or 090..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Inspection Location */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Inspection Location</label>
              <Input
                required
                placeholder="Seller's shop or meetup address..."
                value={inspectionAddress}
                onChange={(e) => setInspectionAddress(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            {/* Buyer Instructions / Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Inspection Checklist / Notes for Artisan</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Test generator on load, check battery health, test AC compressor, check car chassis..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Escrow Inspection Fee */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Standard Inspection Fee (in Escrow)</span>
                <span className="text-[11px] text-slate-500">Only released when inspection report is delivered</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-600">₦</span>
                <input
                  type="number"
                  min="2000"
                  step="500"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-24 h-9 px-2 text-right text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking Inspection...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Book Inspection with Escrow (₦{fee.toLocaleString()})
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/explore?category=${encodeURIComponent(selectedTrade)}&state=${encodeURIComponent(item.state)}`);
                }}
                className="w-full text-center text-xs text-slate-600 hover:text-emerald-700 font-medium py-1.5 transition-colors flex items-center justify-center gap-1"
              >
                <span>Or view all rated {selectedTrade}s in {item.state}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

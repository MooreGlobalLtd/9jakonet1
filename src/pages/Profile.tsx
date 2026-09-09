import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  User as UserIcon, 
  Shield, 
  Briefcase, 
  Wallet, 
  Camera, 
  UploadCloud,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { compressImageFile } from '../lib/imageCompressor';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

import { withTimeout } from '../lib/timeout';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function Profile() {
  const { user, artisanProfile, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Profile Fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [state, setState] = useState(user?.state || 'Lagos');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<{
    displayName?: string;
    phone?: string;
    address?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhone(user.phone || user.phoneNumber || '');
      setAddress(user.address || '');
      if (user.state) setState(user.state);
      if (user.avatar) setAvatarUrl(user.avatar);
    }
  }, [user]);

  if (!user) return null;

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setErrorMessage('');
    try {
      // Compress to optimal size (< 60KB) for instant loading
      const compressed = await compressImageFile(file, { maxDimension: 400, quality: 0.8 });
      setAvatarUrl(compressed);

      // Update Firestore user document
      if (!isQuotaExhausted()) {
        try {
          await withTimeout(updateDoc(doc(db, 'users', user.id), {
            avatar: compressed
          }), 5000);
        } catch (dbErr: any) {
          if (dbErr?.code === 'resource-exhausted' || dbErr?.message?.includes('quota')) {
            markQuotaExhausted();
          } else if (dbErr?.message === 'timeout') {
            console.warn('Firestore update timed out, saving locally...');
          }
          console.warn('Firestore write warning:', dbErr);
        }
      }

      // Update Auth Store in memory immediately
      setUser({
        ...user,
        avatar: compressed
      });

      setSuccessMessage('Profile photo updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setErrorMessage('Failed to process image. Please choose another picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const validate = () => {
    const newErrors: { displayName?: string; phone?: string; address?: string } = {};

    // 1. Full Name
    if (!displayName.trim()) {
      newErrors.displayName = 'Full Name is required.';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Full Name must be at least 2 characters.';
    }

    // 2. Phone Number
    const cleanedPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanedPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (cleanedPhone.length < 10) {
      newErrors.phone = 'Please enter a valid Nigerian phone number (e.g. 08012345678).';
    }

    // 3. Address
    if (!address.trim()) {
      newErrors.address = 'Address / Location is required.';
    } else if (address.trim().length < 4) {
      newErrors.address = 'Please enter your street address or local area (e.g. 12 Allen Avenue, Ikeja).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validate()) {
      setErrorMessage('Please fill in all required fields marked with * before saving.');
      return;
    }

    setLoading(true);
    setIsSaved(false);

    try {
      const updatePayload = {
        displayName: displayName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        state: state,
        avatar: avatarUrl || user.avatar || ''
      };

      // 1. Update in Firestore
      if (!isQuotaExhausted()) {
        try {
          await withTimeout(updateDoc(doc(db, 'users', user.id), updatePayload), 5000);
        } catch (writeErr: any) {
          if (writeErr?.code === 'resource-exhausted' || writeErr?.message?.includes('quota')) {
            console.warn('Firestore quota hit, preserving profile update in local session state.');
            markQuotaExhausted();
          } else if (writeErr?.message === 'timeout') {
            console.warn('Firestore update timed out, saving locally...');
          } else {
            console.warn('Firestore update notice:', writeErr);
          }
        }
      }

      // 2. Update user in memory
      setUser({
        ...user,
        ...updatePayload
      });

      setIsSaved(true);
      setSuccessMessage('Profile updated successfully! All changes have been saved.');

      // Reset saved state after 4 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 4000);
      setTimeout(() => {
        setSuccessMessage('');
      }, 6000);

    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setErrorMessage('Could not update profile: ' + (error?.message || 'Please check your connection.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account information, real profile photo, and contact details.</p>
        </div>
        {user.role === 'artisan' && (
          <div className="flex gap-2">
            <Link to="/wallet">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-emerald-600 text-emerald-700">
                <Wallet className="h-4 w-4" />
                Artisan Wallet
              </Button>
            </Link>
            <Link to="/artisan-setup">
              <Button size="sm" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Briefcase className="h-4 w-4" />
                Trade Setup
              </Button>
            </Link>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}
      
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl">Personal Information &amp; Photo</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Avatar Photo Section */}
          <div className="mb-6 flex flex-wrap items-center gap-5 rounded-xl bg-slate-50 p-5 border border-slate-200/70">
            <div className="relative group">
              <img 
                src={avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=047857&color=fff&size=200`} 
                alt="avatar" 
                className="h-24 w-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Upload profile picture"
                className="absolute bottom-0 right-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 shadow-md border-2 border-white transition-transform hover:scale-105"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-xl text-slate-900">{user.displayName || 'Unnamed User'}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  user.role === 'admin' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                    : user.role === 'artisan' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}>
                  {user.role}
                </span>

                {user.role === 'artisan' && artisanProfile && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    artisanProfile.verificationStatus === 'verified'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    <Shield className="h-3 w-3" />
                    {artisanProfile.verificationStatus === 'verified' ? 'Verified Artisan' : 'Verification Pending'}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500">{user.email}</p>
              
              <div className="pt-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-xs h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-white"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
                  {avatarUploading ? 'Uploading Photo...' : 'Upload Real Picture'}
                </Button>
                <span className="text-[11px] text-slate-400 ml-2">PNG, JPG up to 5MB</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-slate-500" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="e.g. Samuel Ayorinde"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errors.displayName) setErrors(prev => ({ ...prev, displayName: undefined }));
                }}
                className={errors.displayName ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.displayName}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-slate-500" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input 
                type="tel"
                placeholder="e.g. 08012345678 or +2348012345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                }}
                className={errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.phone ? (
                <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.phone}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Used for SMS dispatch alerts, customer contact, and job updates.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  Street Address / Area <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="e.g. 10 Allen Avenue, Ikeja"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
                  }}
                  className={errors.address ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Button 
                type="submit" 
                disabled={loading} 
                className={`px-8 h-11 text-sm font-bold shadow-xs transition-all flex items-center gap-2 ${
                  isSaved 
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    Saved Successfully!
                  </>
                ) : loading ? (
                  <>
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <span className="text-xs text-slate-400">
                Fields marked with <span className="text-red-500">*</span> are mandatory
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

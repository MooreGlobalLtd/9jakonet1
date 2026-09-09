import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { CheckCircle2, AlertCircle, Phone, MapPin, User as UserIcon, Shield, Briefcase, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function Profile() {
  const { user, artisanProfile, init } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [state, setState] = useState(user?.state || 'Lagos');
  
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
      setPhone(user.phone || '');
      setAddress(user.address || '');
      if (user.state) setState(user.state);
    }
  }, [user]);

  if (!user) return null;

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
      newErrors.phone = 'Phone number is required so clients and artisans can contact you.';
    } else {
      // Must be valid phone format (e.g. 08012345678, +2348012345678, or 10-14 digits)
      const phoneRegex = /^(\+?234|0)[789][01]\d{8}$|^(\+?\d{10,14})$/;
      if (!phoneRegex.test(cleanedPhone) || cleanedPhone.length < 10) {
        newErrors.phone = 'Please enter a valid phone number (e.g. 08012345678 or +2348012345678).';
      }
    }

    // 3. Address
    if (!address.trim()) {
      newErrors.address = 'Address / Location is required.';
    } else if (address.trim().length < 5) {
      newErrors.address = 'Please enter a complete address or location (e.g. 10 Allen Avenue, Ikeja).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validate()) {
      setErrorMessage('Please fill in all required fields marked below before saving.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        displayName: displayName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        state: state
      });
      init(); // refresh auth store across app
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account information and contact preferences.</p>
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
              <Button size="sm" className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Trade Setup
              </Button>
            </Link>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
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
          <CardTitle className="text-xl">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=047857&color=fff`} 
              alt="avatar" 
              className="h-20 w-20 rounded-full border-2 border-white shadow-xs object-cover"
            />
            <div className="space-y-1">
              <p className="font-bold text-lg text-slate-900">{user.displayName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
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
                  Required for dispatch notifications, job updates, and customer contact.
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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button type="submit" disabled={loading} className="px-6 bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Saving Changes...' : 'Save Changes'}
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


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

export default function ArtisanSetup() {
  const { user, init } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [trade, setTrade] = useState('');
  const [exp, setExp] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (!isQuotaExhausted()) {
        try {
          await updateDoc(doc(db, 'artisans', user.id), {
            tradeCategory: trade,
            yearsExp: parseInt(exp),
            serviceAreas: [location],
          });
        } catch (error: any) {
          if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
            markQuotaExhausted();
            console.warn('Quota exhausted, artisan profile changes not saved to cloud');
          } else {
            throw error;
          }
        }
      }
      // Re-init auth store to fetch updated profile
      init();
      if (!user.isKycVerified) {
        navigate('/verify-kyc');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Artisan Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Trade Category</label>
              <select 
                required
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
              >
                <option value="">Select a category</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Painter">Painter</option>
                <option value="Mechanic">Mechanic</option>
                <option value="Tailor">Tailor</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Years of Experience</label>
              <Input 
                type="number" 
                required 
                min="0"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Primary Location (LGA, State)</label>
              <Input 
                required 
                placeholder="e.g. Ikeja, Lagos"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function Profile() {
  const { user, init } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        address,
        phone,
      });
      init(); // refresh the auth store
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Your Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="avatar" 
              className="h-20 w-20 rounded-full border border-slate-200"
            />
            <div>
              <p className="font-semibold text-lg">{user.displayName}</p>
              <p className="text-slate-500">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 capitalize">
                {user.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
              <Input 
                placeholder="e.g. 08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Address / Location</label>
              <Input 
                placeholder="e.g. 10 Allen Avenue, Ikeja"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Developer Options for MVP Testing */}
      <Card className="mt-8 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 text-lg">Developer Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">
            Since this is a testing environment, you can click the button below to upgrade your account to an <strong>Admin</strong>. This will give you access to the Admin Panel.
          </p>
          <Button 
            variant="outline" 
            className="border-amber-300 text-amber-900 hover:bg-amber-100"
            onClick={async (e) => {
              e.preventDefault();
              try {
                await updateDoc(doc(db, 'users', user.id), { role: 'admin' });
                await init(); // Refresh auth state
              } catch (error) {
                console.error("Failed to upgrade:", error);
              }
            }}
          >
            Upgrade to Admin Role
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

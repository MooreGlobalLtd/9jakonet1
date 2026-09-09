import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { formatDateTime } from '../lib/utils';
import { Clock } from 'lucide-react';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

export default function Dashboard() {
  const { user, artisanProfile } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const jobsRef = collection(db, 'jobs');
        const q = user.role === 'customer' 
          ? query(jobsRef, where('customerId', '==', user.id))
          : query(jobsRef, where('assignedArtisanId', '==', user.id)); // Simple approximation

        const snap = await getDocs(q);
        setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const newJob = {
        customerId: user.id,
        categoryId: 'general', // Mock
        title: jobTitle,
        description: jobDesc,
        photos: [],
        state: user.state || 'Lagos',
        lga: user.lga || 'Ikeja',
        exactLocation: user.address || '',
        urgency: 'medium',
        status: 'open',
        createdAt: Date.now()
      };
      if (isQuotaExhausted()) {
        alert("System quota limit reached for today. Job cannot be posted at this time.");
        return;
      }

      const docRef = await addDoc(collection(db, 'jobs'), newJob);
      setJobs([{ id: docRef.id, ...newJob } as Job, ...jobs]);
      setShowJobForm(false);
      setJobTitle('');
      setJobDesc('');
    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        markQuotaExhausted();
        alert("System quota limit reached for today. Job cannot be posted at this time.");
      } else {
        console.error("Error posting job:", error);
        alert("Failed to post job");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.displayName}</h1>
          <p className="text-slate-500">
            {user.role === 'customer' ? 'Manage your service requests.' : 'Manage your artisan profile and jobs.'}
          </p>
        </div>
        {user.role === 'customer' && (
          <Button onClick={() => setShowJobForm(!showJobForm)}>
            {showJobForm ? 'Cancel' : 'Post New Job'}
          </Button>
        )}
      </div>

      {showJobForm && (
        <Card className="mb-8 border-emerald-100 bg-emerald-50/50">
          <CardHeader>
            <CardTitle>Post a New Job Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePostJob} className="space-y-4 max-w-2xl">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">What do you need?</label>
                <Input 
                  required 
                  placeholder="e.g. Fix leaking pipe in kitchen" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  placeholder="Describe the issue in detail..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </div>
              <Button type="submit">Submit Request</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Your Jobs</h2>
          {loading ? (
            <div>Loading...</div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <p>No jobs found.</p>
              {user.role === 'customer' && (
                <Button variant="outline" className="mt-4" onClick={() => setShowJobForm(true)}>Post your first job</Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{job.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{job.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded-md capitalize">Status: {job.status}</span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md capitalize">Urgency: {job.urgency}</span>
                          {job.createdAt && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDateTime(job.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to="/jobs">
                        <Button variant="outline" size="sm">View Details & Escrow</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-900">Profile summary</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName}`} className="h-16 w-16 rounded-full" alt="avatar" />
                <div>
                  <div className="font-semibold">{user.displayName}</div>
                  <div className="text-sm text-slate-500 capitalize">{user.role}</div>
                </div>
              </div>
              {user.role === 'artisan' && artisanProfile && (
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Trade</span>
                    <span className="font-medium text-slate-900">{artisanProfile.tradeCategory || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Verification</span>
                    <span className={`font-medium ${artisanProfile.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {artisanProfile.verificationStatus}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span>Rating</span>
                    <span className="font-medium text-slate-900">{artisanProfile.ratingAvg || 'New'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

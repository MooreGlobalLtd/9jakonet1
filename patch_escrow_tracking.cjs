const fs = require('fs');
let content = fs.readFileSync('src/pages/JobsAndEscrow.tsx', 'utf8');

const trackingState = `
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const saveTrackingNumber = async (jobId: string) => {
    if (!trackingInput.trim()) return;
    try {
      await updateDoc(doc(db, 'jobs', jobId), { trackingNumber: trackingInput.trim() });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, trackingNumber: trackingInput.trim() } : j));
      setEditingTracking(null);
      setTrackingInput('');
      toast.success('Tracking information saved!');
    } catch(e) {
      toast.error('Failed to save tracking number');
    }
  };
`;
content = content.replace("const handleResetTestBalance = async () => {", trackingState + "\n  const handleResetTestBalance = async () => {");

const trackingUI = `
                      {job.contractType === 'product' && (job.trackingNumber || user.id === job.artisanId) && (
                         <div className="mt-2 p-2 bg-slate-100 rounded text-xs flex gap-2 items-center flex-wrap">
                           <strong>Tracking / Delivery Info:</strong> 
                           {job.trackingNumber ? (
                             <span>{job.trackingNumber}</span>
                           ) : (
                             user.id === job.artisanId ? (
                               editingTracking === job.id ? (
                                 <div className="flex gap-2 w-full mt-1">
                                    <Input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="e.g. GIG Logistics #12345, or Driver Phone..." className="h-8 text-xs" />
                                    <Button onClick={() => saveTrackingNumber(job.id)} size="sm" className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700">Save</Button>
                                    <Button onClick={() => setEditingTracking(null)} variant="outline" size="sm" className="h-8 px-2">Cancel</Button>
                                 </div>
                               ) : (
                                 <Button onClick={() => {setEditingTracking(job.id); setTrackingInput('');}} variant="outline" size="sm" className="h-6 text-[10px]">Add Tracking</Button>
                               )
                             ) : <span className="text-slate-400">Not provided yet</span>
                           )}
                         </div>
                      )}
`;

content = content.replace(/\{job\.contractType === 'product' && \(job\.trackingNumber \|\| user\.id === job\.artisanId\) && \([\s\S]*?\}\)/, trackingUI);

fs.writeFileSync('src/pages/JobsAndEscrow.tsx', content);

import { ShieldCheck, Handshake, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="font-sans pb-24">
      {/* Header */}
      <div className="bg-slate-900 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">How 9jaKonet Works</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            We built this platform to completely eliminate the fear of hiring local service providers in Nigeria. 
            Here is how we keep your money and your home safe.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 mt-16 space-y-24">
        
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2">
            <div className="bg-emerald-50 text-emerald-600 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Find a Verified Artisan</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Every Artisan on our platform goes through a strict verification process. 
              We check their ID cards, track their past reviews, and monitor their performance. 
              Search for exactly who you need by location or trade.
            </p>
          </div>
          <div className="w-full md:w-1/2 bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
             <ShieldCheck className="w-32 h-32 text-emerald-500/20 absolute -right-4 -bottom-4" />
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="text-emerald-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">ID Verified</h4>
                  <p className="text-sm text-slate-500">Government ID checked</p>
                </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-blue-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">5-Star Rated</h4>
                  <p className="text-sm text-slate-500">Based on real customer reviews</p>
                </div>
             </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
          <div className="w-full md:w-1/2">
            <div className="bg-blue-50 text-blue-600 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Agree & Fund the Escrow</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Chat with the artisan securely on the platform. Once you agree on a price, you don't pay them directly. 
              Instead, you fund the job through our secure <strong>Escrow System</strong>. The artisan knows the money is safe, but they can't touch it yet.
            </p>
          </div>
          <div className="w-full md:w-1/2 bg-slate-50 p-8 rounded-3xl border border-slate-100">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center">
                <Handshake className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h4 className="font-bold text-slate-900 text-lg mb-2">Escrow Protected</h4>
                <p className="text-slate-500">Your money is held in a secure vault until the job is done.</p>
             </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2">
            <div className="bg-amber-50 text-amber-600 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Release Funds When Satisfied</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              The Artisan comes to your home, does the work, and ensures everything is working perfectly. 
              Once you are 100% happy with the result, you click a button to release the funds from Escrow to their wallet.
            </p>
          </div>
          <div className="w-full md:w-1/2 bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-center items-center">
             <Button className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 mb-4">
               Release Funds to Artisan
             </Button>
             <p className="text-sm text-slate-500 text-center">We only take a small 10% platform fee from the Artisan's earnings when the job is successfully completed.</p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center pt-12 border-t border-slate-100">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to get started?</h2>
          <Button size="lg" className="h-14 px-8 text-lg" onClick={() => navigate('/explore')}>
            Find an Artisan Now
          </Button>
        </div>

      </div>
    </div>
  );
}

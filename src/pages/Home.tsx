import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, ShieldCheck, Zap, Handshake, CheckCircle2, Quote, Stethoscope, Car, PenTool, Instagram, Twitter, Youtube } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'motion/react';

const categories = [
  { name: 'Electrician', icon: Zap, count: 120 },
  { name: 'Plumber', icon: WrenchIcon, count: 85 },
  { name: 'Mechanic', icon: PenTool, count: 64 },
  { name: 'Painter', icon: PaintbrushIcon, count: 42 },
  { name: 'Doctor/Nurse', icon: Stethoscope, count: 28 },
  { name: 'Driver', icon: Car, count: 50 },
];

const testimonials = [
  {
    name: "Chioma E.",
    role: "Homeowner in Lekki",
    text: "I was always scared of giving artisans money upfront. With the Escrow feature, I finally have peace of mind. The plumber only got paid when my sink was perfectly fixed!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&auto=format&fit=crop&q=80"
  },
  {
    name: "Tunde O.",
    role: "Verified Electrician",
    text: "Since I joined 9jaKonet, I don't argue with clients about payment anymore. Once the job is booked, I know the money is safe. It's changed my business entirely.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=150&auto=format&fit=crop&q=80"
  },
  {
    name: "Aisha F.",
    role: "Restaurant Manager",
    text: "When our AC broke down on a Friday night, I found a verified technician here in 10 minutes. The service was professional and the payment process was seamless.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=150&auto=format&fit=crop&q=80"
  }
];

function WrenchIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}

function HammerIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16 4.6V3.86a2.92 2.92 0 0 0-.86-2.08c-.6-.6-1.4-.93-2.25-.93h-.86L9.64 3.24c-.4.4-.64 1-.64 1.6v.86l-2.4 2.4c-.6.6-.93 1.4-.93 2.25v.86l5.73 5.73"/></svg>
}

function PaintbrushIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/></svg>
}

export default function Home() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col font-sans overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.07]" />
        
        {/* Decorative Gradients */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" 
        />
        
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 mb-8 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          >
            <ShieldCheck className="h-4 w-4" />
            100% Escrow Protected Payments
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 leading-tight"
          >
            Find Trusted Artisans in <span className="text-emerald-400 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">Nigeria</span> Instantly.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mx-auto max-w-2xl text-xl leading-8 text-slate-300 mb-12"
          >
            The safest way to hire verified electricians, plumbers, and carpenters. Money is held in Escrow until you are 100% satisfied with the work.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto flex max-w-3xl flex-col sm:flex-row gap-2 rounded-2xl bg-white/5 p-2 shadow-2xl backdrop-blur-md border border-white/10"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <Input placeholder="What service do you need?" className="h-12 border-0 bg-white/10 pl-12 text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-emerald-500" />
            </div>
            <div className="hidden sm:block w-px bg-white/10 my-2" />
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <Input placeholder="Location (e.g. Ikeja, Lagos)" className="h-12 border-0 bg-white/10 pl-12 text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-emerald-500" />
            </div>
            <Button 
              size="lg" 
              className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              onClick={() => navigate('/explore')}
            >
              Search Pros
            </Button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-slate-400 font-medium"
          >
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" /> 10,000+ Completed Jobs</div>
            <div className="flex items-center gap-2"><Star className="h-4.5 w-4.5 text-emerald-400" /> 4.8/5 Average Rating</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4.5 w-4.5 text-emerald-400" /> ID Verified Artisans</div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="mb-16 flex items-end justify-between"
          >
            <div>
              <motion.h2 variants={itemVariants} className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Popular Categories</motion.h2>
              <motion.p variants={itemVariants} className="text-lg text-slate-500">Hire professionals for your everyday needs</motion.p>
            </div>
            <motion.div variants={itemVariants}>
              <Link to="/explore" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hidden sm:flex items-center gap-1 group">
                View all categories 
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8"
          >
            {categories.map((cat) => (
              <motion.div key={cat.name} variants={itemVariants}>
                <Link to={`/explore?category=${cat.name.toLowerCase()}`} className="group flex flex-col items-center rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-xl hover:shadow-emerald-900/5 h-full">
                  <div className="mb-6 rounded-2xl bg-white p-5 text-slate-700 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:text-emerald-600 group-hover:shadow-md">
                    <cat.icon className="h-10 w-10" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{cat.name}</h3>
                  <p className="text-sm font-medium text-slate-500">{cat.count} Pros</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-50 border-t border-slate-100 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[80px] opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[80px] opacity-70 pointer-events-none" />

        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-200/50 px-3 py-1 text-xs font-semibold text-slate-700 mb-6">
              HOW IT WORKS
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6">Zero Risk. Total Trust.</h2>
            <p className="text-lg text-slate-600">We completely engineered the risk out of hiring local professionals with our secure end-to-end escrow system.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid gap-12 lg:grid-cols-3 relative"
          >
            {/* Connecting lines for desktop */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-100 via-slate-200 to-emerald-100 -z-10" />
            
            <motion.div variants={itemVariants} className="text-center relative group">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-xl shadow-blue-900/5 ring-1 ring-slate-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-blue-900/10 rotate-3">
                <Search className="h-10 w-10 -rotate-3" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-slate-900">1. Find a Pro</h3>
              <p className="text-slate-600 leading-relaxed px-4">Browse through our list of ID-verified professionals in your area. Read real reviews and compare portfolios instantly.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="text-center relative group">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-xl shadow-amber-900/5 ring-1 ring-slate-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-amber-900/10 -rotate-3">
                <Handshake className="h-10 w-10 rotate-3" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-slate-900">2. Fund Escrow</h3>
              <p className="text-slate-600 leading-relaxed px-4">Chat with the artisan, agree on a price, and securely fund the escrow. We lock the money in a digital vault.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="text-center relative group">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-xl shadow-emerald-900/5 ring-1 ring-slate-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-emerald-900/10 rotate-3">
                <ShieldCheck className="h-10 w-10 -rotate-3" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-slate-900">3. Release Funds</h3>
              <p className="text-slate-600 leading-relaxed px-4">Once you are 100% satisfied with the finished job, click a button to release the funds directly to the artisan's wallet.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Loved by Nigerians</h2>
            <p className="text-lg text-slate-600">See what happens when you remove the friction from hiring local talent.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative"
              >
                <Quote className="absolute top-6 right-6 h-8 w-8 text-emerald-100 rotate-180" />
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-8 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <img src={testimonial.avatar} alt={testimonial.name} className="h-12 w-12 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-slate-900" />
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80&w=1925&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
         
         <div className="container relative mx-auto max-w-4xl px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Ready to hire a verified professional?</h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Join thousands of Nigerians using 9jaKonet for safe, reliable, and stress-free services today.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-8 text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20" onClick={() => navigate('/explore')}>
                  Find an Artisan Now
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-600 text-white hover:bg-slate-800 hover:text-white" onClick={() => navigate('/register')}>
                  Join as a Professional
                </Button>
              </div>
            </motion.div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 border-t border-white/5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-slate-400">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">9jaKonet</h3>
              <p className="text-sm leading-relaxed mb-6">
                The safest way to hire verified artisans in Nigeria. Zero risk, total trust.
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center font-bold text-lg leading-none">
                  <span className="mb-1">tik</span><span className="mb-1">tok</span>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✉</span>
                  <a href="mailto:info@mooregloballtd.online" className="hover:text-emerald-400 transition-colors">
                    info@mooregloballtd.online
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">☎</span>
                  <a href="tel:09021171832" className="hover:text-emerald-400 transition-colors">
                    09021171832
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">📍</span>
                  <span>Lagos, Nigeria (Operating Nationwide)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/escrow-policy" className="hover:text-emerald-400 transition-colors">Escrow Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-slate-600">
            &copy; {new Date().getFullYear()} 9jaKonet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Search, Wrench, CreditCard, Star, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SCENE_DURATION = 4000; // 4 seconds per scene

export default function PromoTrailer() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentScene < 6) {
      timer = setTimeout(() => {
        setCurrentScene((prev) => prev + 1);
      }, SCENE_DURATION);
    } else if (currentScene >= 6) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [currentScene, isPlaying]);

  const startTrailer = () => {
    setCurrentScene(0);
    setIsPlaying(true);
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.5 } }
  };

  const renderScene = () => {
    switch (currentScene) {
      case 0:
        return (
          <motion.div key="scene0" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }} 
              animate={{ scale: 1, rotate: 0 }} 
              transition={{ type: "spring", duration: 1.5, bounce: 0.5 }}
              className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4"
            >
              <span className="text-4xl font-extrabold text-white">9ja</span>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-5xl font-black text-white tracking-tight"
            >
              9jaKonet
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
              className="text-xl text-blue-200 font-medium max-w-sm"
            >
              The Game-Changer for Artisans and Customers.
            </motion.p>
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="scene1" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full p-6">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md w-full max-w-sm mb-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 bg-white rounded-full p-3 shadow-inner">
                <Search className="text-slate-400 w-5 h-5 ml-2" />
                <div className="w-2 h-5 bg-blue-500 animate-pulse rounded-sm"></div>
                <span className="text-slate-400 font-medium overflow-hidden whitespace-nowrap animate-[typing_2s_steps(20,end)]">Need a Plumber fast...</span>
              </div>
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}
                    key={i} className="bg-white rounded-xl p-3 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center">
                       <Wrench className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                    </div>
                    <ShieldCheck className="text-green-500 w-5 h-5" />
                  </motion.div>
                ))}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white text-center leading-tight">Find Verified Professionals <span className="text-blue-300">Instantly.</span></h2>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="scene2" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full p-6">
             <div className="bg-white rounded-3xl p-6 w-full max-w-sm mb-8 shadow-2xl transform rotate-2">
                <div className="flex justify-center mb-4">
                   <div className="w-20 h-20 bg-blue-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative">
                      <Wrench className="w-8 h-8 text-blue-600" />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                   </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Expert Plumber</h3>
                  <div className="flex justify-center text-amber-400 my-1">
                    <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-sm text-slate-500">100% Job Success</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="h-20 bg-slate-100 rounded-xl"></div>
                  <div className="h-20 bg-slate-100 rounded-xl"></div>
                </div>
                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                   Hire Now <Zap className="w-4 h-4" />
                </button>
             </div>
             <h2 className="text-3xl font-bold text-white text-center leading-tight">Hire Based on <span className="text-blue-300">Real Work & Reviews.</span></h2>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="scene3" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full p-6">
             <motion.div 
               animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
               className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.5)] mb-8 relative"
             >
               <CreditCard className="w-16 h-16 text-blue-600" />
               <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">Secured</div>
             </motion.div>
             <h2 className="text-3xl font-bold text-white text-center leading-tight mb-4">Secure Escrow <span className="text-blue-300">Payments.</span></h2>
             <p className="text-blue-100 text-center text-lg max-w-xs">
                Your money is locked safely until you are 100% satisfied with the job.
             </p>
          </motion.div>
        );
      case 4:
         return (
          <motion.div key="scene4" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full p-6">
            <div className="relative mb-12">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.6)] z-10 relative"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-green-500 rounded-full z-0"
              />
            </div>
            <h2 className="text-3xl font-bold text-white text-center leading-tight mb-4">Job Done. <br/><span className="text-green-300">Funds Released.</span></h2>
            <p className="text-blue-100 text-center text-lg max-w-xs">
              Artisans get paid instantly. Customers get the quality they deserve.
            </p>
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="scene5" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full text-center p-6">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6"
            >
              <span className="text-3xl font-extrabold text-white">9ja</span>
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-2">9jaKonet</h1>
            <p className="text-blue-200 font-medium mb-12">Powered by Moore Global Limited</p>
            
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
              className="text-white border border-white/30 bg-white/10 px-8 py-3 rounded-full font-semibold backdrop-blur-sm"
            >
              Sign Up Today
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-hidden flex justify-center items-center">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900 opacity-60"></div>
      
      {/* Mobile Screen Container for perfect aspect ratio recording */}
      <div className="relative w-full h-full max-w-md max-h-[900px] bg-slate-900/40 shadow-2xl sm:rounded-[40px] sm:border-[8px] border-slate-800 overflow-hidden backdrop-blur-xl">
        
        {!isPlaying && currentScene === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-900 z-50 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mb-8">
              <span className="text-3xl font-extrabold text-white">9ja</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Promo Video Generator</h2>
            <p className="text-slate-400 mb-12 max-w-sm">
              Tap the button below, then immediately start your phone's screen recorder. The automated presentation will run for exactly 24 seconds.
            </p>
            <button 
              onClick={startTrailer}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
            >
              Play Video Presentation <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 text-slate-400 font-medium p-2"
            >
              Cancel & Go Back
            </button>
          </div>
        ) : null}

        <div className="absolute inset-0 z-10 flex flex-col">
          {/* Progress Bar */}
          {isPlaying && (
            <div className="h-1 bg-slate-800 w-full z-50">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: SCENE_DURATION / 1000, ease: "linear", repeat: 5 }}
                key={currentScene} // Reset animation on scene change
              />
            </div>
          )}

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {renderScene()}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Playback Controls (Hidden during play, shows when done) */}
        {!isPlaying && currentScene >= 6 && (
          <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-md">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Presentation Complete</h3>
            <p className="text-slate-300 text-center mb-8">
              Stop your screen recorder now. You can post this video directly to your WhatsApp status!
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl shadow-lg mb-4"
            >
              Back to App
            </button>
            <button 
              onClick={startTrailer}
              className="text-blue-400 font-medium"
            >
              Replay Presentation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

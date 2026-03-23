import { useState, useEffect, useCallback } from "react";
import { getProfile, getQuote } from "@/lib/api";
import { SYMBOLS } from "@/lib/data";
import { Pause, Play, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SlideshowTab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the data for the current slide
  const fetchData = useCallback(async (symbol: string) => {
    setIsLoading(true);
    const [q, p] = await Promise.all([getQuote(symbol), getProfile(symbol)]);
    setQuote(q);
    setProfile(p);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(SYMBOLS[currentIndex]);
  }, [currentIndex, fetchData]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SYMBOLS.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [isPaused]);

  const sy = SYMBOLS[currentIndex];
  const isUp = quote && quote.d >= 0;

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 min-h-[500px] animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Clickable Area for pause/unpause */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setIsPaused(!isPaused);
        }}
        className="relative group cursor-pointer w-full max-w-2xl min-h-[400px] sm:h-auto sm:aspect-video rounded-[2rem] glass-panel border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] bg-gradient-to-br from-gray-900/80 to-black/80"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sy}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12 text-center"
          >
            {profile && profile.logo ? (
              <img src={profile.logo} alt={sy} className="w-16 h-16 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-2xl shadow-2xl bg-white/10 object-contain p-2 ring-1 ring-white/20 shrink-0" />
            ) : (
               <div className="w-16 h-16 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center shadow-2xl ring-1 ring-white/20 shrink-0">
                 <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
               </div>
            )}
            
            <h2 className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-tight line-clamp-2">
              {profile ? profile.name : sy}
            </h2>
            <div className="text-sm sm:text-xl text-indigo-400 font-bold tracking-widest uppercase mb-4 sm:mb-8 opacity-80">{sy}</div>
            
            {quote && (
              <div className="flex flex-col items-center mt-auto sm:mt-0">
                <span className="text-4xl sm:text-6xl font-black text-white mb-3 sm:mb-4 tracking-tighter">
                  ${quote.c?.toFixed(2) || "0.00"}
                </span>
                
                <div className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-sm sm:text-xl ${isUp ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isUp ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                  <span>{isUp ? "+" : ""}{quote.d?.toFixed(2)}</span>
                  <span className="opacity-75">({isUp ? "+" : ""}{quote.dp?.toFixed(2)}%)</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Play/Pause Overlay Icon */}
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur border border-white/10 p-3 rounded-xl pointer-events-none">
          {isPaused ? <Play className="w-6 h-6 text-white" fill="currentColor"/> : <Pause className="w-6 h-6 text-white" fill="currentColor"/>}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 glass-panel px-6 py-3 rounded-full border border-white/10">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          {isPaused ? <span className="text-red-400">Paused</span> : <span className="text-green-400 animate-pulse">Live Playing</span>} 
          <span className="mx-2 opacity-30">•</span> 
          {currentIndex + 1} / {SYMBOLS.length}
        </div>
      </div>
    </div>
  );
}

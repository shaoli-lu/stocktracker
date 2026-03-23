import { useState, useEffect } from "react";
import { getQuote } from "@/lib/api";
import { SYMBOLS } from "@/lib/data";
import { useStock } from "@/lib/StockContext";

export default function HeatmapTab() {
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const { setSelectedSymbol, setActiveTab } = useStock();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setIsLoading(true);
      const qs: Record<string, any> = {};
      
      const batches = [];
      for (let i = 0; i < SYMBOLS.length; i += 5) {
        batches.push(SYMBOLS.slice(i, i + 5));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (sym) => {
            const q = await getQuote(sym);
            if (q) qs[sym] = q;
          })
        );
      }
      
      if (mounted) {
        setQuotes(qs);
        setIsLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, []);

  const getHeatmapColor = (dp: number) => {
    if (dp === undefined) return "bg-gray-800";
    if (dp >= 5) return "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]";
    if (dp >= 2) return "bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.4)]";
    if (dp > 0) return "bg-emerald-700/80 shadow-[0_0_10px_rgba(4,120,87,0.3)]";
    if (dp <= -5) return "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]";
    if (dp <= -2) return "bg-rose-700/80 shadow-[0_0_15px_rgba(190,18,60,0.4)]";
    if (dp < 0) return "bg-red-800/80 shadow-[0_0_10px_rgba(153,27,51,0.3)]";
    return "bg-gray-700";
  };

  const getCellSize = (dp: number) => {
    const abs = Math.abs(dp || 0);
    if (abs >= 5) return "col-span-2 row-span-2 text-2xl p-6";
    if (abs >= 2) return "col-span-1 row-span-2 text-xl p-4";
    return "col-span-1 row-span-1 text-base p-3";
  };

  return (
    <div className="flex-grow flex flex-col p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8 z-10 glass-panel px-6 py-4 rounded-2xl w-full">
         <div>
           <h2 className="text-2xl font-black text-white tracking-tight">Market Heatmap</h2>
           <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-widest">Real-time Performance Weighted</p>
         </div>
         {isLoading && Object.keys(quotes).length === 0 && (
           <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
         )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 auto-rows-[100px] z-10 pb-12 w-full">
        {SYMBOLS.map((sym) => {
          const quote = quotes[sym];
          const dp = quote?.dp;
          
          return (
            <div
              key={sym}
              onClick={(e) => {
                 e.stopPropagation();
                 setSelectedSymbol(sym);
                 setActiveTab("Candle");
              }}
              className={`${getHeatmapColor(dp)} ${getCellSize(dp)} rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 group overflow-hidden relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <span className="font-extrabold text-white tracking-tight z-10">{sym}</span>
              {quote && dp !== undefined ? (
                <span className="font-bold text-white/90 z-10">
                  {dp > 0 ? "+" : ""}{dp.toFixed(2)}%
                </span>
              ) : (
                <span className="w-10 h-4 bg-white/20 rounded animate-pulse mt-1 z-10"></span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { getProfile, getQuote } from "@/lib/api";
import { SYMBOLS } from "@/lib/data";
import { useStock } from "@/lib/StockContext";
import { ChevronRight, DollarSign, Building, Globe, Phone, ExternalLink } from "lucide-react";

export default function ProfileTab() {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const { setSelectedSymbol, setActiveTab } = useStock();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    async function fetchAll(isInitial: boolean = false) {
      if (isInitial) setIsLoading(true);
      
      const profs: Record<string, any> = {};
      const qs: Record<string, any> = {};

      // Fetch in batches of 5 to avoid hammering the Finnhub API rate limits too hard simultaneously
      for (let i = 0; i < SYMBOLS.length; i += 5) {
        if (!mounted) break;
        const batch = SYMBOLS.slice(i, i + 5);
        await Promise.all(
          batch.map(async (sym) => {
            const [p, q] = await Promise.all([getProfile(sym), getQuote(sym)]);
            if (p) profs[sym] = p;
            if (q) qs[sym] = q;
          })
        );
      }
      
      if (mounted) {
        setProfiles(profs);
        setQuotes(qs);
        setIsLoading(false);
      }
    }

    fetchAll(true);

    interval = setInterval(() => {
      fetchAll(false);
    }, 60000); // Polling every 60s

    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      {isLoading && Object.keys(profiles).length === 0 && (
         <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...SYMBOLS].sort((a, b) => {
          let capA = Number(profiles[a]?.marketCapitalization) || 0;
          let capB = Number(profiles[b]?.marketCapitalization) || 0;
          
          if (profiles[a]?.currency === "TWD") capA /= 31.8;
          else if (profiles[a]?.currency === "EUR") capA *= 1.08;
          else if (profiles[a]?.currency === "GBP") capA *= 1.25;
          else if (profiles[a]?.currency === "JPY") capA /= 150.0;
          
          if (profiles[b]?.currency === "TWD") capB /= 31.8;
          else if (profiles[b]?.currency === "EUR") capB *= 1.08;
          else if (profiles[b]?.currency === "GBP") capB *= 1.25;
          else if (profiles[b]?.currency === "JPY") capB /= 150.0;

          return capB - capA;
        }).map((sym) => {
          const profile = profiles[sym] || {};
          const quote = quotes[sym] || {};
          const isUp = quote.d >= 0;

          return (
            <div 
              key={sym}
               onClick={(e) => {
                 e.stopPropagation();
                 setSelectedSymbol(sym);
                 setActiveTab("Candle");
               }}
              className="glass-panel p-6 rounded-[2rem] hover:bg-white-[0.02] hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] transition-all duration-300 border border-white/5 cursor-pointer group flex flex-col relative overflow-hidden"
            >
              {/* Highlight gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6 z-10 relative">
                 <div className="flex items-center gap-4">
                    {profile.logo ? (
                      <img src={profile.logo} alt={sym} className="w-14 h-14 rounded-2xl bg-white/10 object-contain p-1.5 ring-1 ring-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center ring-1 ring-white/10">
                        <DollarSign className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-indigo-300 transition-colors">
                        {sym}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase truncate max-w-[120px]">
                        {profile.name || "Loading..."}
                      </p>
                    </div>
                 </div>
                 
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                   <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
                 </div>
              </div>

              {quote && Object.keys(quote).length > 0 ? (
                <div className="flex flex-col z-10 relative mt-auto">
                   <div className="text-3xl font-black text-white mb-2 tracking-tighter">
                     ${quote.c?.toFixed(2)}
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <div className={`flex items-center gap-2 font-bold text-sm ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                       <span>{isUp ? "+" : ""}{quote.d?.toFixed(2)}</span>
                       <span className="opacity-70">({isUp ? "+" : ""}{quote.dp?.toFixed(2)}%)</span>
                     </div>
                     {quote.t && (
                       <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                         As of {new Date(quote.t * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </div>
                     )}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col z-10 relative mt-auto opacity-50">
                   <div className="text-2xl font-bold bg-gray-800 rounded-lg w-24 h-8 animate-pulse mb-2"></div>
                   <div className="bg-gray-800 rounded-lg w-16 h-4 animate-pulse"></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium text-gray-400 z-10 relative bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-0.5">Mkt Cap ($M)</span>
                  <span className="text-white">
                    {profile.marketCapitalization ? (
                      (() => {
                        let mktCap = Number(profile.marketCapitalization);
                        // Convert Finnhub's native currency Market Cap back into unified USD estimations
                        if (profile.currency === "TWD") mktCap /= 31.8;
                        else if (profile.currency === "EUR") mktCap *= 1.08;
                        else if (profile.currency === "GBP") mktCap *= 1.25;
                        else if (profile.currency === "JPY") mktCap /= 150.0;
                        return mktCap.toLocaleString(undefined, {maximumFractionDigits: 1});
                      })()
                    ) : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-0.5">Shares Out (M)</span>
                  <span className="text-white">
                    {profile.shareOutstanding ? (
                       // ADR mapping for TSM outstanding shares to accurately reflect US liquidity
                       profile.currency === 'TWD' 
                       ? (Number(profile.shareOutstanding) / 5).toLocaleString(undefined, {maximumFractionDigits: 1})
                       : Number(profile.shareOutstanding).toLocaleString(undefined, {maximumFractionDigits: 1})
                    ) : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 mt-1">
                  <span className="text-gray-500 mb-0.5">IPO Date</span>
                  <span className="text-white">{profile.ipo || "N/A"}</span>
                </div>
              </div>

              {/* Company Meta */}
              {profile.weburl && (
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 z-10 relative">
                  <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Building className="w-3.5 h-3.5" />
                    {profile.finnhubIndustry || "N/A"}
                  </span>
                  <a href={profile.weburl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors" onClick={e => e.stopPropagation()}>
                    <Globe className="w-3.5 h-3.5" />
                    Site
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}

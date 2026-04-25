import { useState, useEffect } from "react";
import { Activity, TrendingUp, TrendingDown, Building, Globe } from "lucide-react";
import { useStock } from "@/lib/StockContext";
import { getProfile, getQuote, getMetric } from "@/lib/api";
import { SYMBOLS } from "@/lib/data";

export default function MostActivesTab() {
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState("gainers");
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const { setSelectedSymbol, setActiveTab } = useStock();

  useEffect(() => {
    let mounted = true;

    async function fetchMarketMovers() {
      if (!mounted) return;
      setIsLoading(true);

      const qs: Record<string, any> = {};

      for (let i = 0; i < SYMBOLS.length; i += 5) {
        if (!mounted) break;
        const batch = SYMBOLS.slice(i, i + 5);
        await Promise.all(
          batch.map(async (sym) => {
            const q = await getQuote(sym).catch(() => null);
            if (q) qs[sym] = q;
          })
        );
        // Small delay to help stay within Finnhub rate limits (60/min)
        if (i + 5 < SYMBOLS.length) await new Promise(r => setTimeout(r, 600));
      }

      if (mounted) {
        setQuotes(prev => ({ ...prev, ...qs }));
        setIsLoading(false);
      }
    }

    fetchMarketMovers();

    const interval = setInterval(() => {
      fetchMarketMovers();
    }, 60000); // Polling every 60s

    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, []);

  // Compute the sorted list based on the active category
  const sortedSymbols = [...SYMBOLS].filter(sym => quotes[sym] && quotes[sym].dp !== undefined).sort((a, b) => {
    const dpA = quotes[a].dp;
    const dpB = quotes[b].dp;
    
    if (activeCategory === "gainers") {
      return dpB - dpA; // Highest to lowest
    } else {
      return dpA - dpB; // Lowest to highest
    }
  });

  const currentList = sortedSymbols.slice(0, visibleCount);

  // Fetch profiles only for visible symbols
  useEffect(() => {
    let mounted = true;

    const fetchProfiles = async () => {
      const ps: Record<string, any> = {};
      const ms: Record<string, any> = {};
      const toFetch = currentList.filter(s => !profiles[s]);
      
      if (toFetch.length === 0) return;

      for (let i = 0; i < toFetch.length; i += 5) {
        if (!mounted) break;
        const batch = toFetch.slice(i, i + 5);
        await Promise.all(
          batch.map(async (sym: string) => {
             const [p, m] = await Promise.all([
                getProfile(sym).catch(() => null),
                getMetric(sym).catch(() => null)
             ]);
             if (p) ps[sym] = p;
             if (m && m.metric) ms[sym] = m.metric;
          })
        );
        if (i + 5 < toFetch.length) await new Promise(r => setTimeout(r, 600));
      }
      
      if (mounted) {
        setProfiles(prev => ({ ...prev, ...ps }));
        setMetrics(prev => ({ ...prev, ...ms }));
      }
    };

    fetchProfiles();

    return () => { mounted = false; };
  }, [currentList, profiles]);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-12 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between glass-panel p-6 rounded-2xl w-full gap-4 shrink-0 shadow-2xl relative border border-white/5">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-6 h-6 text-indigo-400" />
            Market Movers
          </h2>
          <p className="text-xs font-semibold text-indigo-400/80 mt-1 uppercase tracking-widest pl-9">
            Ranked by % Price Change
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          {['gainers', 'losers'].map((cat) => (
             <button
                key={cat}
                onClick={() => {
                   setActiveCategory(cat);
                   setVisibleCount(12);
                }}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
             >
                {cat}
             </button>
          ))}
        </div>
      </div>

      {isLoading && Object.keys(quotes).length === 0 ? (
        <div className="flex items-center justify-center py-20 flex-col gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
          <p className="text-indigo-400 font-bold animate-pulse">Scanning Market Activity...</p>
        </div>
      ) : sortedSymbols.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-gray-400 font-bold">
           Market data currently unavailable. Please try again later.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentList.map((sym: string, idx: number) => {
              const quote = quotes[sym];
              const profile = profiles[sym];
              const metric = metrics[sym];
              const isUp = quote.d >= 0;
              const avgVol = metric && metric['10DayAverageTradingVolume'] 
                ? (metric['10DayAverageTradingVolume'] * 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                : null;

              return (
                <div
                  key={`${activeCategory}-${sym}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSymbol(sym);
                    setActiveTab("Candle");
                  }}
                  className="glass-panel p-6 rounded-[2rem] hover:bg-white-[0.02] hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] transition-all duration-300 border border-white/5 cursor-pointer group flex flex-col relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-4 z-10 relative">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {profile && profile.logo ? (
                          <img src={profile.logo} alt={sym} className="w-12 h-12 rounded-2xl bg-white/10 object-contain p-1.5 ring-1 ring-white/10 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center ring-1 ring-white/10 font-black text-indigo-400 text-lg shrink-0 shadow-inner">
                            <Building className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#0a0f18] shadow-lg">
                          {idx + 1}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-white mb-0.5 group-hover:text-indigo-300 transition-colors">
                          {sym}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase truncate max-w-[120px]">
                          {profile?.name || "Loading..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col z-10 relative mb-2 flex-grow">
                    <div className="text-3xl font-black text-white mb-2 tracking-tighter">
                      ${quote.c?.toFixed(2)}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className={`flex items-center gap-2 font-bold text-sm ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isUp ? "+" : ""}{quote.d?.toFixed(2)}</span>
                        <span className="opacity-70">({isUp ? "+" : ""}{quote.dp?.toFixed(2)}%)</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1 bg-black/40 w-fit px-2 py-1 rounded border border-white/5">
                        10-Day Avg Vol: {avgVol || "..."}
                      </div>
                    </div>
                  </div>

                  {/* Meta details footer */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-gray-500 z-10 relative h-8">
                    {profile ? (
                      <>
                        <span className="flex items-center gap-1.5 truncate max-w-[60%]">
                           <Building className="w-3.5 h-3.5 shrink-0" />
                           <span className="truncate">{profile.exchange || "N/A"}</span>
                        </span>
                        {profile.weburl && (
                           <a href={profile.weburl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-400 transition-colors shrink-0" onClick={e => e.stopPropagation()}>
                             <Globe className="w-3.5 h-3.5" /> Site
                           </a>
                        )}
                      </>
                    ) : (
                      <div className="w-full flex justify-between">
                         <div className="w-16 h-3 bg-white/5 rounded animate-pulse"></div>
                         <div className="w-12 h-3 bg-white/5 rounded animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedSymbols.length > visibleCount && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="glass-panel px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold text-indigo-400 flex items-center justify-center gap-2 shadow-lg"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

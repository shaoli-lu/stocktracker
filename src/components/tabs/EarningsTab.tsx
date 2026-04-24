import { useState, useEffect } from "react";
import { getEarnings, getProfile, getQuote } from "@/lib/api";
import { ChevronRight, DollarSign, Building, Globe, ChevronLeft, ChevronRight as IconRight, Calendar as CalendarIcon, Phone, ExternalLink, Star, TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { useStock } from "@/lib/StockContext";
import { SYMBOLS } from "@/lib/data";

export default function EarningsTab() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [fullEarningsByDay, setFullEarningsByDay] = useState<Record<number, any[]>>({});
  const [visibleCounts, setVisibleCounts] = useState<Record<number, number>>({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 });
  const [loadingMoreDay, setLoadingMoreDay] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { setSelectedSymbol, setActiveTab } = useStock();

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  useEffect(() => {
    let mounted = true;
    async function fetchWeekData() {
      setIsLoading(true);
      setFullEarningsByDay({});
      setVisibleCounts({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 });

      // Always grab from Monday to Friday
      const fromDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate());
      const toDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + 4);

      // Manual naive offset string to prevent UTC date shifting
      const formatYMD = (d: Date) => {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
      };

      const fromStr = formatYMD(fromDate);
      const toStr = formatYMD(toDate);

      const weekEarnings = await getEarnings(fromStr, toStr);
      if (!mounted) return;

      const items = (weekEarnings?.earningsCalendar || [])
        .filter((e: any) => e.revenueEstimate)
        .sort((a: any, b: any) => Number(b.revenueEstimate) - Number(a.revenueEstimate));

      const grouped: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      const symbolsToFetch = new Set<string>();

      for (const e of items) {
        if (!e.date) continue;
        const [y, m, d] = e.date.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        const day = dateObj.getDay();
        if (day >= 1 && day <= 5) {
          grouped[day].push(e);
          if (grouped[day].length <= 4) { // Initial 4 companies to fetch
            symbolsToFetch.add(e.symbol);
          }
        }
      }

      setFullEarningsByDay(grouped);

      const ps: Record<string, any> = {};
      const qs: Record<string, any> = {};
      const symArray = Array.from(symbolsToFetch);

      // fetch in small batches, wait 500ms between batches to stay under rate limits
      for (let i = 0; i < symArray.length; i += 5) {
        if (!mounted) break;
        const batch = symArray.slice(i, i + 5);
        await Promise.all(
          batch.map(async (sym) => {
            // Check cache to avoid rate hits immediately
            const profilePromise = profiles[sym] ? Promise.resolve(profiles[sym]) : getProfile(sym).catch(() => null);
            const quotePromise = getQuote(sym).catch(() => null);

            const [p, q] = await Promise.all([profilePromise, quotePromise]);
            if (p) ps[sym] = p;
            if (q) qs[sym] = q;
          })
        );
        if (i + 5 < symArray.length) await new Promise(r => setTimeout(r, 600));
      }

      if (mounted) {
        setProfiles(prev => ({ ...prev, ...ps }));
        setQuotes(prev => ({ ...prev, ...qs }));
        setIsLoading(false);
      }
    }

    fetchWeekData();

    return () => { mounted = false; };
  }, [currentWeekStart]); // Only fetch when week changes

  const handleLoadMore = async (day: number) => {
    setLoadingMoreDay(day);
    const currentCount = visibleCounts[day] || 4;
    const newCount = currentCount + 4;
    
    const earningsForDay = fullEarningsByDay[day] || [];
    const newlyVisible = earningsForDay.slice(currentCount, newCount);
    
    const symbolsToFetch = newlyVisible.map(e => e.symbol).filter(sym => !profiles[sym] || !quotes[sym]);
    
    if (symbolsToFetch.length > 0) {
      const ps: Record<string, any> = {};
      const qs: Record<string, any> = {};
      
      await Promise.all(
        symbolsToFetch.map(async (sym) => {
          const profilePromise = profiles[sym] ? Promise.resolve(profiles[sym]) : getProfile(sym).catch(() => null);
          const quotePromise = quotes[sym] ? Promise.resolve(quotes[sym]) : getQuote(sym).catch(() => null);
          const [p, q] = await Promise.all([profilePromise, quotePromise]);
          if (p) ps[sym] = p;
          if (q) qs[sym] = q;
        })
      );
      
      setProfiles(prev => ({ ...prev, ...ps }));
      setQuotes(prev => ({ ...prev, ...qs }));
    }
    
    setVisibleCounts(prev => ({ ...prev, [day]: newCount }));
    setLoadingMoreDay(null);
  };

  const getDayName = (dayIndex: number) => {
    switch (dayIndex) {
      case 1: return "Monday";
      case 2: return "Tuesday";
      case 3: return "Wednesday";
      case 4: return "Thursday";
      case 5: return "Friday";
      default: return "";
    }
  };

  const currentFriday = new Date(currentWeekStart);
  currentFriday.setDate(currentFriday.getDate() + 4);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-12 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between glass-panel p-6 rounded-2xl w-full gap-4 shrink-0 shadow-2xl relative border border-white/5">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-indigo-400" />
          Market Earnings
        </h2>

        <div className="flex items-center gap-4 bg-black/40 rounded-xl p-1.5 border border-white/5">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-gray-300 w-44 text-center">
            {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {currentFriday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
          <button onClick={handleNextWeek} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            <IconRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 flex-col gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
          <p className="text-indigo-400 font-bold animate-pulse">Scanning Global Market Calendars...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
          {[1, 2, 3, 4, 5].map(day => {
            const dateForDay = new Date(currentWeekStart);
            dateForDay.setDate(dateForDay.getDate() + (day - 1));
            const isToday = new Date().toDateString() === dateForDay.toDateString();
            const formattedDate = dateForDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            return (
              <div key={day} className={`flex flex-col gap-4 min-h-[400px] transition-all duration-500 ${isToday ? 'z-20 scale-[1.02]' : 'z-10'}`}>
                <div className={`glass-panel p-4 rounded-2xl border text-center shadow-lg flex flex-col items-center justify-center transition-all relative ${isToday ? 'border-indigo-400 bg-indigo-500/30 ring-2 ring-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'border-white/5 bg-black/20'}`}>
                  {isToday && (
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl -z-10 rounded-full animate-pulse"></div>
                  )}
                  {isToday && (
                    <span className="absolute -top-2.5 bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                      Today
                    </span>
                  )}
                  <span className={`text-lg font-black tracking-widest uppercase bg-clip-text text-transparent ${isToday ? 'bg-gradient-to-br from-white to-indigo-100' : 'bg-gradient-to-br from-white to-gray-400'}`}>
                    {getDayName(day)}
                  </span>
                  <span className={`text-xs font-bold mt-1 uppercase tracking-wider ${isToday ? 'text-indigo-200' : 'text-indigo-400/80'}`}>
                    {formattedDate}
                  </span>
                </div>

                <div className="flex flex-col gap-4 h-full">
                  {!fullEarningsByDay[day] || fullEarningsByDay[day].length === 0 ? (
                    <div className="flex-grow flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-6 text-center">
                      <span className="text-sm font-bold text-gray-600">No major earnings today<br />/ Market Holiday</span>
                    </div>
                  ) : (
                    <>
                    {fullEarningsByDay[day].slice(0, visibleCounts[day] || 4).map(e => {
                      const profile = profiles[e.symbol] || {};


                      const isTracked = SYMBOLS.includes(e.symbol);
                      const hourLabel = e.hour === 'amc' ? 'After Market Close' : e.hour === 'bmo' ? 'Before Market Open' : e.hour?.toUpperCase() || 'Undetermined';

                      return (
                        <div
                          key={e.symbol}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedSymbol(e.symbol);
                            setActiveTab("Candle");
                          }}
                          className={`glass-panel p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col relative overflow-hidden shrink-0 border ${isTracked ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-500/5' : 'border-white/5 hover:bg-white-[0.02] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)]'}`}
                        >
                          <div className="flex justify-between items-start mb-4 z-10 relative">
                            <div className="flex items-center gap-3">
                              {profile.logo ? (
                                <img src={profile.logo} alt={e.symbol} className="w-10 h-10 rounded-xl bg-white/10 object-contain p-1 ring-1 ring-white/10" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center ring-1 ring-white/10">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-bold tracking-tight text-white mb-0 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                                  {e.symbol}
                                  {isTracked && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase truncate max-w-[80px]">
                                  {profile.name || "Loading..."}
                                </p>
                              </div>
                            </div>

                            {quotes[e.symbol] && (
                              <div className="flex flex-col items-end text-right shrink-0">
                                <div className="text-base font-black text-white leading-none mb-1">
                                  ${quotes[e.symbol].c?.toFixed(2)}
                                </div>
                                <div className={`text-[10px] font-bold flex items-center gap-1 leading-none ${quotes[e.symbol].d >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {quotes[e.symbol].d >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {quotes[e.symbol].d > 0 ? "+" : ""}{quotes[e.symbol].d?.toFixed(2)} ({quotes[e.symbol].dp?.toFixed(2)}%)
                                </div>
                                <div className="text-[8px] text-gray-500 font-medium mt-1 leading-none">
                                  {new Date(quotes[e.symbol].t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </div>
                              </div>
                            )}
                          </div>


                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-auto border-t border-white/10 pt-3 z-10 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center w-full">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-indigo-400">Q{e.quarter} '{e.year?.toString().slice(-2)} Report</span>
                                <span className="text-white bg-white/5 py-1 px-2 rounded-md w-fit flex items-center gap-1.5">
                                  {hourLabel}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-2 p-3 bg-black/40 rounded-xl border border-white/5">
                              {/* EPS Section */}
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-gray-400 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-indigo-400" /> EPS</span>
                                  <span className="text-gray-400">
                                    Est {e.epsEstimate !== null && e.epsEstimate !== undefined ? e.epsEstimate.toFixed(2) : "N/A"}
                                  </span>
                                </div>
                                {e.epsActual !== null && e.epsActual !== undefined && (
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-white pl-5">Actual: {e.epsActual.toFixed(2)}</span>
                                    {e.epsEstimate !== null && e.epsEstimate !== undefined && (
                                      <span className={`flex items-center gap-0.5 font-bold ${e.epsActual >= e.epsEstimate ? "text-green-400" : "text-red-400"}`}>
                                        {e.epsActual >= e.epsEstimate ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {e.epsActual >= e.epsEstimate ? "Beat by $" : "Miss by $"}{Math.abs(e.epsActual - e.epsEstimate).toFixed(2)} ({e.epsActual >= e.epsEstimate ? "+" : ""}{((e.epsActual - e.epsEstimate) / (Math.abs(e.epsEstimate) || 1) * 100).toFixed(1)}%)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Revenue Section */}
                              <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-2">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-gray-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-400" /> Revenue</span>
                                  <span className="text-gray-400">
                                    Est {e.revenueEstimate !== null && e.revenueEstimate !== undefined ? (e.revenueEstimate >= 1e9 ? `$${(e.revenueEstimate / 1e9).toFixed(2)}B` : e.revenueEstimate >= 1e6 ? `$${(e.revenueEstimate / 1e6).toFixed(2)}M` : `$${e.revenueEstimate.toLocaleString()}`) : "N/A"}
                                  </span>
                                </div>
                                {e.revenueActual !== null && e.revenueActual !== undefined && (
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-white pl-5">Actual: {e.revenueActual >= 1e9 ? `$${(e.revenueActual / 1e9).toFixed(2)}B` : e.revenueActual >= 1e6 ? `$${(e.revenueActual / 1e6).toFixed(2)}M` : `$${e.revenueActual.toLocaleString()}`}</span>
                                    {e.revenueEstimate !== null && e.revenueEstimate !== undefined && (
                                      <span className={`flex items-center gap-0.5 font-bold ${e.revenueActual >= e.revenueEstimate ? "text-green-400" : "text-red-400"}`}>
                                        {e.revenueActual >= e.revenueEstimate ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {e.revenueActual >= e.revenueEstimate ? "Beat by $" : "Miss by $"}{Math.abs(e.revenueActual - e.revenueEstimate) >= 1e9 ? `${(Math.abs(e.revenueActual - e.revenueEstimate) / 1e9).toFixed(2)}B` : Math.abs(e.revenueActual - e.revenueEstimate) >= 1e6 ? `${(Math.abs(e.revenueActual - e.revenueEstimate) / 1e6).toFixed(2)}M` : `${Math.abs(e.revenueActual - e.revenueEstimate).toLocaleString()}`} ({e.revenueActual >= e.revenueEstimate ? "+" : ""}{((e.revenueActual - e.revenueEstimate) / (Math.abs(e.revenueEstimate) || 1) * 100).toFixed(1)}%)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {e.epsActual !== null && e.epsActual !== undefined && e.epsEstimate !== null && e.epsEstimate !== undefined && (
                                <div className={`text-[9px] py-1 px-2 rounded-md font-bold mt-1.5 text-center flex items-center justify-center gap-1.5 ${e.epsActual >= e.epsEstimate ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                  {e.epsActual >= e.epsEstimate ? "POSITIVE MARKET REACTION" : "NEGATIVE MARKET REACTION"}
                                </div>
                              )}
                            </div>
                          </div>

                          {profile.weburl && (
                            <a href={profile.weburl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 hover:text-indigo-400 transition-colors text-[10px] text-gray-500 z-10" onClick={ev => ev.stopPropagation()}>
                              <Globe className="w-3.5 h-3.5" />
                              Webcast / IR Site
                            </a>
                          )}
                        </div>
                      );
                    })}
                    {fullEarningsByDay[day].length > (visibleCounts[day] || 4) && (
                      <button
                        onClick={() => handleLoadMore(day)}
                        disabled={loadingMoreDay === day}
                        className="glass-panel p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold text-indigo-400 w-full flex items-center justify-center gap-2 mt-2"
                      >
                        {loadingMoreDay === day ? (
                          <>
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

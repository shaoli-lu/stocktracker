import { useState, useEffect } from "react";
import { getEarnings, getProfile } from "@/lib/api";
import { ChevronRight, DollarSign, Building, Globe, ChevronLeft, ChevronRight as IconRight, Calendar as CalendarIcon, Phone, ExternalLink, Star } from "lucide-react";
import { useStock } from "@/lib/StockContext";
import { SYMBOLS } from "@/lib/data";

export default function EarningsTab() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [earningsByDay, setEarningsByDay] = useState<Record<number, any[]>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
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
      setEarningsByDay({});

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
        const dateObj = new Date(Number(y), Number(m)-1, Number(d));
        const day = dateObj.getDay(); 
        if (day >= 1 && day <= 5) {
          if (grouped[day].length < 4) { // Top 4 companies per day
            grouped[day].push(e);
            symbolsToFetch.add(e.symbol);
          }
        }
      }

      setEarningsByDay(grouped);

      const ps: Record<string, any> = {};
      const symArray = Array.from(symbolsToFetch);

      // fetch in small batches, wait 500ms between batches to stay under rate limits
      for (let i = 0; i < symArray.length; i += 5) {
        if (!mounted) break;
        const batch = symArray.slice(i, i + 5);
        await Promise.all(
          batch.map(async (sym) => {
            // Check cache to avoid rate hits immediately
            const p = profiles[sym] ? profiles[sym] : await getProfile(sym).catch(()=>null);
            if (p) ps[sym] = p;
          })
        );
        if (i + 5 < symArray.length) await new Promise(r => setTimeout(r, 600));
      }

      if (mounted) {
        setProfiles(prev => ({ ...prev, ...ps }));
        setIsLoading(false);
      }
    }

    fetchWeekData();

    return () => { mounted = false; };
  }, [currentWeekStart]); // Only fetch when week changes

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
            const formattedDate = dateForDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            return (
            <div key={day} className="flex flex-col gap-4 min-h-[400px]">
              <div className="glass-panel p-4 rounded-2xl border border-white/5 text-center shadow-lg bg-black/20 flex flex-col items-center justify-center">
                <span className="text-lg font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                  {getDayName(day)}
                </span>
                <span className="text-xs font-bold text-indigo-400/80 mt-1 uppercase tracking-wider">
                  {formattedDate}
                </span>
              </div>
              
              <div className="flex flex-col gap-4 h-full">
                {!earningsByDay[day] || earningsByDay[day].length === 0 ? (
                  <div className="flex-grow flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-6 text-center">
                    <span className="text-sm font-bold text-gray-600">No major earnings today<br />/ Market Holiday</span>
                  </div>
                ) : (
                  earningsByDay[day].map(e => {
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
                        </div>


                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-auto border-t border-white/10 pt-3 z-10 flex flex-col gap-1.5">
                           <span className="text-indigo-400">Q{e.quarter} '{e.year?.toString().slice(-2)} Report</span>
                           <span className="text-white bg-white/5 py-1 px-2 rounded-md w-fit">{hourLabel}</span>
                        </div>
                        
                        {profile.weburl && (
                          <a href={profile.weburl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 hover:text-indigo-400 transition-colors text-[10px] text-gray-500 z-10" onClick={ev => ev.stopPropagation()}>
                            <Globe className="w-3.5 h-3.5" />
                            Webcast / IR Site
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

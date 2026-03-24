import { useState, useEffect } from "react";
import { getCompanyNews } from "@/lib/api";
import { useStock } from "@/lib/StockContext";
import { Newspaper, ExternalLink, Calendar, ChevronDown } from "lucide-react";
import { SYMBOLS } from "@/lib/data";

export default function NewsTab() {
  const { selectedSymbol } = useStock();
  const [newsScope, setNewsScope] = useState("ALL");
  const [prevScopeSymbol, setPrevScopeSymbol] = useState(selectedSymbol);
  
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with global header if user makes a global search
  if (selectedSymbol !== prevScopeSymbol) {
    setNewsScope(selectedSymbol);
    setPrevScopeSymbol(selectedSymbol);
  }

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    async function fetchNews(isInitial: boolean = false) {
      if (isInitial) setIsLoading(true);
      
      let data = [];
      
      if (newsScope === "ALL") {
        const { getMarketNews } = await import("@/lib/api");
        data = (await getMarketNews()) || [];
      } else {
        const { getCompanyNews } = await import("@/lib/api");
        const to = new Date().toISOString().split("T")[0];
        const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // last 7 days
        data = (await getCompanyNews(newsScope, from, to)) || [];
      }
      
      if (mounted) {
        // Explicitly enforce desc chronological sorting 
        const sortedData = data.sort((a: any, b: any) => b.datetime - a.datetime);
        setNews(sortedData);
        setIsLoading(false);
      }
    }

    fetchNews(true);

    interval = setInterval(() => {
      fetchNews(false);
    }, 60000); // Polling every 60s

    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, [newsScope]);

  return (
    <div className="flex-grow flex flex-col p-4 animate-in slide-in-from-bottom-4 duration-500 pb-12 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 z-10 glass-panel px-6 py-5 rounded-3xl gap-4">
         <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <Newspaper className="w-6 h-6 text-white" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white tracking-tight">Financial News</h2>
             <p className="text-sm font-semibold text-indigo-400 mt-0.5 uppercase tracking-widest leading-none">Market Intelligence</p>
           </div>
         </div>
         
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <select
                value={newsScope}
                onChange={(e) => setNewsScope(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full appearance-none bg-black/60 border border-gray-700 focus:border-indigo-500 text-white pl-5 pr-12 py-3 rounded-2xl font-bold cursor-pointer outline-none transition-all shadow-inner hover:bg-black/80"
              >
              <option value="ALL">All Market</option>
              {(!SYMBOLS.includes(newsScope) && newsScope !== "ALL" ? [newsScope, ...SYMBOLS] : SYMBOLS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            
           {isLoading && (
             <div className="w-10 h-10 shrink-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           )}
         </div>
      </div>

      {!isLoading && news.length === 0 && (
        <div className="glass-panel py-20 rounded-[2rem] flex flex-col items-center justify-center border border-white/5 text-gray-400 text-center font-semibold">
           <Newspaper className="w-16 h-16 opacity-20 mb-4" />
           <p className="text-xl">No major news for {newsScope} in the past 7 days.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 w-full mb-12">
        {news.slice(0, 15).map((item, idx) => (
          <a
            key={item.id || idx}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="glass-panel rounded-[2rem] overflow-hidden group cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:-translate-y-1 flex flex-col relative"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
             <div className="p-6 flex flex-col flex-grow z-10 relative">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-4 tracking-wider">
                  <span className="bg-indigo-500/20 px-2.5 py-1.5 rounded-md uppercase">{item.source}</span>
                  <span className="flex items-center gap-1.5 opacity-80 bg-black/40 px-2.5 py-1.5 rounded-md">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.datetime * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white leading-snug mb-3 group-hover:text-indigo-300 transition-colors line-clamp-3">
                  {item.headline}
                </h3>
                
                <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-6 flex-grow">
                  {item.summary}
                </p>
                
                <div className="mt-auto flex items-center text-sm font-bold text-indigo-400 gap-1.5 group-hover:gap-2.5 transition-all">
                  Read Full Article <ExternalLink className="w-4 h-4" />
                </div>
             </div>
          </a>
        ))}
      </div>
    </div>
  );
}

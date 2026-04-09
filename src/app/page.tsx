"use client";

import { useStock } from "@/lib/StockContext";
import { Search, Activity, MonitorPlay, User, BarChart2, Grid, FileText, Loader2, Calendar as CalendarIcon, HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { SYMBOLS } from "@/lib/data";
import { searchStocks } from "@/lib/api";
import HelpModal from "@/components/HelpModal";

// Import tabs
import SlideshowTab from "@/components/tabs/SlideshowTab";
import LeadersTab from "@/components/tabs/LeadersTab";
import CandleTab from "@/components/tabs/CandleTab";
import HeatmapTab from "@/components/tabs/HeatmapTab";
import NewsTab from "@/components/tabs/NewsTab";
import EarningsTab from "@/components/tabs/EarningsTab";

const TABS = [
  { id: "Leaders", icon: User },
  { id: "News", icon: FileText },
  { id: "Earnings", icon: CalendarIcon },
  { id: "Candle", icon: BarChart2 },
  { id: "Slideshow", icon: MonitorPlay },
  { id: "Heatmap", icon: Grid },
];

export default function Home() {
  const { setSelectedSymbol, activeTab, setActiveTab } = useStock();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ symbol: string; description: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  // Shared fetch function (used by Enter + Go button)
  const fetchResults = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      const formatted = results
        .filter((r: any) => !r.symbol.includes(".") && r.type !== "")
        .slice(0, 10)
        .map((r: any) => ({
          symbol: r.symbol,
          description: r.description,
        }));
      setSearchResults(formatted);
      setIsSearchOpen(true); // Open only after results are ready
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    setSearchQuery("");
    setIsSearchOpen(false);
    if (activeTab !== "Candle" && activeTab !== "Profile" && activeTab !== "News") {
      setActiveTab("Candle");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchResults(searchQuery); // immediate search on Enter
    }
  };

  const handleSearchClick = () => {
    fetchResults(searchQuery);
  };

  return (
    <>
      <main className="min-h-screen flex flex-col pt-6 px-4 md:px-8 pb-12 w-full mx-auto relative z-10 transition-colors bg-[#0a0f18]/80 max-w-7xl shadow-2xl overflow-hidden glass-panel my-8 rounded-3xl border border-white/5">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 z-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse">
              <Activity className="text-white w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-200 to-indigo-500">
                  MarketHeat
                </h1>
                <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 text-indigo-400 transition-all active:scale-90"
                  aria-label="Help Guide"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-indigo-400 font-bold tracking-widest uppercase">
                Wealth Engine
              </p>
            </div>
          </div>

          {/* Global Search */}
          <div className="relative w-full md:w-[480px]" ref={searchRef}>
            <div className="relative flex items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by Symbol..."
                  className="w-full bg-black/40 backdrop-blur-md border border-gray-700/50 focus:border-indigo-500 rounded-full py-3.5 pl-12 pr-4 text-base font-medium text-white placeholder-gray-400 outline-none transition-all shadow-inner hover:bg-black/60 focus:bg-black/80"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) {
                      setIsSearchOpen(false);
                      setSearchResults([]);
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setIsSearchOpen(true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 animate-spin pointer-events-none" />
                )}
              </div>
              <button
                onClick={handleSearchClick}
                disabled={!searchQuery.trim() || isSearching}
                className="ml-2 px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 uppercase"
              >
                Go
              </button>
            </div>

            {isSearchOpen && searchQuery && (
              <div className="absolute top-full mt-3 w-full bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-[22rem] overflow-y-auto">
                {searchResults.length > 0 ? (
                  <ul className="py-2">
                    {searchResults.map((item) => (
                      <li
                        key={item.symbol}
                        className="px-5 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors flex flex-col gap-0.5 border-b border-white/5 last:border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSymbol(item.symbol);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white tracking-wider">
                            {item.symbol}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 truncate w-full">
                          {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-sm font-medium text-gray-400 text-center flex flex-col items-center">
                    {!isSearching
                      ? `No markets found matching "${searchQuery}"`
                      : "Searching global data..."}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* TABS DIVIDER & TABS */}
        <div className="flex justify-center mb-8 max-w-full overflow-hidden px-1">
          <nav className="flex gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl overflow-x-auto no-scrollbar scroll-smooth w-full md:w-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shrink-0 whitespace-nowrap ${isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 transform scale-100 md:scale-105"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "animate-bounce" : ""}`} />
                  {tab.id}
                </button>
              );
            })}
          </nav>
        </div>

        {/* CONTENT ENGINE */}
        <section className="flex-grow flex flex-col relative w-full h-full min-h-[500px]">
          {activeTab === "Leaders" && <LeadersTab />}
          {activeTab === "News" && <NewsTab />}
          {activeTab === "Earnings" && <EarningsTab />}
          {activeTab === "Candle" && <CandleTab />}
          {activeTab === "Slideshow" && <SlideshowTab />}
          {activeTab === "Heatmap" && <HeatmapTab />}
        </section>
      </main>

      {/* MODALS */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
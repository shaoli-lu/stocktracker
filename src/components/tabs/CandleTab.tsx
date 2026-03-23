import { useEffect, useRef, useState } from "react";
import { useStock } from "@/lib/StockContext";
import { SYMBOLS } from "@/lib/data";
import { ChevronDown, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    TradingView: any;
  }
}

const RESOLUTIONS = [
  { label: "1 Min", value: "1" },
  { label: "5 Min", value: "5" },
  { label: "15 Min", value: "15" },
  { label: "30 Min", value: "30" },
  { label: "1 Hour", value: "60" },
  { label: "1 Day", value: "D" },
  { label: "1 Week", value: "W" },
  { label: "1 Month", value: "M" },
];

export default function CandleTab() {
  const { selectedSymbol, setSelectedSymbol } = useStock();
  const [resolution, setResolution] = useState("D");
  const containerId = useRef(`tv_chart_${Math.random().toString(36).substring(7)}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (!containerRef.current) return;
    
    // Clear previous widget injection
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined" && window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: selectedSymbol, // TradingView smartly auto-resolves plain symbols across all exchanges
          interval: resolution,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          gridColor: "rgba(255, 255, 255, 0.05)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          toolbar_bg: "rgba(0, 0, 0, 0.8)",
          container_id: containerId.current,
        });
        setIsLoading(false);
      }
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup script carefully to prevent memory leaks on continuous re-renders
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [selectedSymbol, resolution]);

  return (
    <div className="flex flex-col w-full h-full gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 glass-panel p-4 rounded-2xl items-center justify-between z-10 shadow-2xl">
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="appearance-none bg-black/60 border border-gray-700 hover:border-indigo-500 text-white pl-4 pr-10 py-2.5 rounded-xl font-bold cursor-pointer outline-none transition-all shadow-inner focus:bg-black/80 ring-0"
            >
              {(!SYMBOLS.includes(selectedSymbol) ? [selectedSymbol, ...SYMBOLS] : SYMBOLS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="appearance-none bg-black/60 border border-gray-700 hover:border-indigo-500 text-white pl-4 pr-10 py-2.5 rounded-xl font-semibold cursor-pointer outline-none transition-all shadow-inner focus:bg-black/80 ring-0"
            >
              {RESOLUTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-indigo-400 font-medium animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Connecting Advanced Chart...</span>
          </div>
        )}
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-2xl bg-black/40 pt-2 flex-grow min-h-[500px]">
        {/* TradingView Advanced Widget Container */}
        <div id={containerId.current} ref={containerRef} className="w-full h-full absolute inset-0 rounded-b-2xl" />
      </div>
    </div>
  );
}

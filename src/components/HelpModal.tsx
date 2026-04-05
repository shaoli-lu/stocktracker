"use client";

import { X, Info, Zap, BarChart3, Globe, Calendar, Layout } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[75vh] overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0d1117]/90 glass-panel flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/20 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/10 blur-[100px] rounded-full" />

            {/* Header */}
            <div className="relative p-4 border-b border-white/5 flex justify-between items-center bg-transparent">
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30"
                >
                  <Info className="w-5 h-5 text-indigo-400" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white">MarketHeat Guide</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-tight">Quick start instructions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="relative flex-grow overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar scroll-smooth">
              <section className="space-y-2">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400"
                >
                  Welcome
                </motion.h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  MarketHeat aggregates real-time data for informational and casual exploration of market trends.
                </p>
              </section>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: Zap, title: "Market Insights", desc: "View real-time mover updates for casual monitoring.", color: "text-indigo-400" },
                  { icon: BarChart3, title: "Visual Analytics", desc: "Explore candlestick charting and market depth.", color: "text-fuchsia-400" },
                  { icon: Calendar, title: "Earnings View", desc: "Browse the weekly earnings calendar.", color: "text-emerald-400" },
                  { icon: Layout, title: "Heatmap View", desc: "See the market at a glance with color-coded maps.", color: "text-amber-400" },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-4 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-black/20 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.section 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 border-dashed"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-lg bg-indigo-500/20">
                    <Globe className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-sm">Quick Search</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      Use the search bar at the top to find any symbol. Press <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-100 border border-gray-600 text-[10px] font-mono shadow-sm">Enter</kbd> to refresh results.
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.section 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="p-4 rounded-xl bg-red-500/5 border border-red-500/10"
              >
                <h4 className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-400" />
                  Legal Disclaimer
                </h4>
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  Information provided is for casual use and education only. No guarantee of accuracy. Past performance does not represent future results. Not intended for trading or financial advice.
                </p>
              </motion.section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 flex justify-end bg-[#0d1117]/50 backdrop-blur-xl">
              <button
                onClick={onClose}
                className="w-full px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/40 active:scale-95 flex items-center justify-center gap-2"
              >
                Got it, thanks!
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Zap className="w-4 h-4 fill-white" />
                </motion.div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

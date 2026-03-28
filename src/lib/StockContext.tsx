"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { SYMBOLS } from "./data";

interface StockContextType {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState("AMZN");
  const [activeTab, setActiveTab] = useState("Leaders"); // default tab

  return (
    <StockContext.Provider value={{ selectedSymbol, setSelectedSymbol, activeTab, setActiveTab }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error("useStock must be used within a StockProvider");
  }
  return context;
}

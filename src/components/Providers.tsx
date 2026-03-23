"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { StockProvider } from "@/lib/StockContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Small explosion effect at the cursor position
      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
        colors: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
        zIndex: 9999,
      });
    };

    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  return <StockProvider>{children}</StockProvider>;
}

"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AuthProvider } from "@/lib/AuthContext";
import PasswordGate from "@/components/PasswordGate";
import { StockProvider } from "@/lib/StockContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Avoid firing global confetti if clicking inputs or buttons inside forms
      const target = e.target as HTMLElement;
      if (target.closest("input, button, [role='button'], select, textarea")) {
        return;
      }

      // Small explosion effect at the cursor position
      confetti({
        particleCount: 35,
        spread: 50,
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

  return (
    <AuthProvider>
      <PasswordGate>
        <StockProvider>{children}</StockProvider>
      </PasswordGate>
    </AuthProvider>
  );
}

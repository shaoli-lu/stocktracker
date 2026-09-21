"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Activity, Lock, Unlock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, verifyPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      inputRef.current?.focus();
    }
  }, [isLoading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await verifyPassword(password);
    if (!result.success) {
      setError(result.error || "Incorrect passcode");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
      inputRef.current?.focus();
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f18]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse">
            <Activity className="text-white w-8 h-8" strokeWidth={2.5} />
          </div>
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-4 bg-[#0a0f18]">
        <div className="flex-grow flex items-center justify-center py-12">
          <div
            className={`w-full max-w-[420px] glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
              isShaking ? "animate-[shake_0.5s_ease-in-out]" : ""
            }`}
            style={{
              animation: isShaking
                ? "shake 0.5s cubic-bezier(.36,.07,.19,.97) both"
                : undefined,
            }}
          >
            {/* Header / Logo */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.6)] mb-4 animate-pulse">
                <Activity className="text-white w-9 h-9" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-200 to-indigo-500">
                MarketHeat
              </h1>
              <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase mt-1">
                Market Pulse
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-center text-sm text-gray-400 font-medium">
                This app is password protected.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Passcode"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-black/40 backdrop-blur-md border border-gray-700/60 focus:border-indigo-500 rounded-xl py-3.5 pl-4 pr-11 text-base font-medium text-white placeholder-gray-500 outline-none transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/30"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={!password.trim() || isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Unlock</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-gray-500 font-medium">
          <p>Made with ❤️ and ☕</p>
        </footer>
      </div>
    );
  }

  return <>{children}</>;
}

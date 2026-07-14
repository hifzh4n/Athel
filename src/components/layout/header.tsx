"use client";

import { useEffect } from "react";
import { useSignalStore } from "@/store/useSignalStore";

import Image from "next/image";

export function Header() {
  const { unlockAudio, livePrice, priceDirection, listenToLivePrice } = useSignalStore();

  useEffect(() => {
    listenToLivePrice();
  }, [listenToLivePrice]);

  // Auto-unlock audio on first user interaction anywhere on the page
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [unlockAudio]);

  const colorClass = priceDirection === 'down' ? 'text-red-400' : 'text-emerald-400';
  const bgClass = priceDirection === 'down' ? 'bg-red-400' : 'bg-emerald-400';

  return (
    <header className="h-16 md:h-16 flex items-center justify-between px-4 md:px-6 glass border-b sticky top-0 z-40">
      <div className="md:hidden flex items-center gap-2">
        <img src="/logo.png" alt="Athel Logo" className="w-7 h-7 rounded object-contain" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-primary tracking-tight neon-text font-script mt-1 leading-none">Athel</h1>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-sans font-medium">XAUUSD</span>
            {livePrice ? (
              <span className={`text-[9px] ${colorClass} font-mono font-bold flex items-baseline gap-1 transition-colors duration-300`}>
                <span className={`w-1 h-1 rounded-full ${bgClass} animate-pulse self-center transition-colors duration-300`}></span>
                {livePrice.toFixed(2)}
              </span>
            ) : (
              <span className="text-[9px] text-muted-foreground font-mono">...</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


"use client";

import { useEffect } from "react";
import { useSignalStore } from "@/store/useSignalStore";

import Image from "next/image";

export function Header() {
  const { unlockAudio, livePrices, listenToLivePrice } = useSignalStore();

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

  return (
    <header className="h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center justify-between px-4 lg:px-6 glass border-b sticky top-0 z-40 shrink-0">
      <div className="lg:hidden flex items-center gap-2">
        <img src="/logo.png" alt="Athel Logo" className="w-7 h-7 rounded object-contain shrink-0" />
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <h1 className="text-lg font-bold text-primary tracking-tight neon-text font-script leading-none mt-1">Athel</h1>
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-sans font-medium mt-1 truncate">Trading Engine</span>
        </div>
      </div>
    </header>
  );
}


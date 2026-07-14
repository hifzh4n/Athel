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
    <header className="h-16 md:h-16 flex items-center justify-between px-4 md:px-6 glass border-b sticky top-0 z-40">
      <div className="md:hidden flex items-center gap-2">
        <img src="/logo.png" alt="Athel Logo" className="w-7 h-7 rounded object-contain" />
        <div className="flex flex-col flex-1">
          <h1 className="text-lg font-bold text-primary tracking-tight neon-text font-script mt-1 leading-none">Athel</h1>
        </div>
      </div>
    </header>
  );
}


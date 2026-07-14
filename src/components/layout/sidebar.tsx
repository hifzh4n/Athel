"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, User } from "lucide-react";
import { useSignalStore } from "@/store/useSignalStore";
import Image from "next/image";
import { useEffect } from "react";

export function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { livePrices, listenToLivePrice } = useSignalStore();

  useEffect(() => {
    listenToLivePrice();
  }, [listenToLivePrice]);

  return (
    <aside className={`flex w-64 flex-col bg-card border-r sticky top-0 h-screen ${className}`}>
      <div className="h-auto min-h-20 py-4 flex items-start px-6 gap-3 border-b border-border">
        <img src="/logo.png" alt="Athel Logo" className="w-8 h-8 rounded-md object-contain" />
        <div className="flex flex-col flex-1 w-full">
          <h1 className="text-xl font-bold text-primary neon-text tracking-tight font-script">Athel</h1>
          <div className="flex flex-col gap-1 mt-1">
            {Object.keys(livePrices).length > 0 ? (
              Object.entries(livePrices).map(([safeSymbol, data]) => (
                <div key={safeSymbol} className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-1 last:border-0 last:pb-0">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-sans font-medium">{safeSymbol.replace(/_/g, " ")}</span>
                  <span className={`text-[10px] ${data.direction === 'down' ? 'text-red-400' : 'text-emerald-400'} font-mono font-bold flex items-baseline gap-1 transition-colors duration-300`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${data.direction === 'down' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse self-center transition-colors duration-300`}></span>
                    {data.price.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground font-mono">Loading prices...</span>
            )}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
            pathname === '/dashboard' 
              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_var(--primary)]' 
              : 'hover:bg-accent text-accent-foreground border border-transparent'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Link>
        <Link 
          href="/signals" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
            pathname === '/signals' 
              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_var(--primary)]' 
              : 'hover:bg-accent text-accent-foreground border border-transparent'
          }`}
        >
          <Activity className="w-5 h-5" /> Signals
        </Link>

        <div className="pt-4 mt-4 border-t border-border">
          <Link 
            href="/profile" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all opacity-80 ${
              pathname === '/profile' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'hover:bg-accent text-accent-foreground border border-transparent'
            }`}
          >
            <User className="w-5 h-5" /> Profile
          </Link>
        </div>
      </nav>
    </aside>
  );
}

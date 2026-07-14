"use client";

import { useSignalStore } from "@/store/useSignalStore";

export function LivePricesGrid() {
  const { livePrices } = useSignalStore();
  
  const entries = Object.entries(livePrices);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {entries.map(([safeSymbol, data]) => (
        <div key={safeSymbol} className="glass-panel rounded-xl p-4 flex flex-col justify-center items-center text-center gap-1.5 shadow-sm border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-sans font-medium">{safeSymbol.replace(/_/g, " ")}</span>
          <span className={`text-xl ${data.direction === 'down' ? 'text-red-400' : 'text-emerald-400'} font-mono font-bold flex items-center gap-2 relative z-10`}>
            {data.price.toFixed(2)}
            <span className={`w-1.5 h-1.5 rounded-full ${data.direction === 'down' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`}></span>
          </span>
        </div>
      ))}
    </div>
  );
}

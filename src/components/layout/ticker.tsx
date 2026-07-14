"use client";

import { useSignalStore } from "@/store/useSignalStore";

export function Ticker() {
  const { livePrices } = useSignalStore();
  
  if (Object.keys(livePrices).length === 0) return null;

  return (
    <div className="w-full bg-black/40 border-b border-white/5 py-2 px-4 md:px-6 overflow-hidden flex items-center shrink-0 backdrop-blur-md relative z-30">
       <div className="flex items-center gap-8 overflow-x-auto no-scrollbar w-full">
         {Object.entries(livePrices).map(([safeSymbol, data]) => (
            <div key={safeSymbol} className="flex items-baseline gap-2 shrink-0">
               <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-sans font-medium">{safeSymbol.replace(/_/g, " ")}</span>
               <span className={`text-sm ${data.direction === 'down' ? 'text-red-400' : 'text-emerald-400'} font-mono font-bold flex items-baseline gap-1`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${data.direction === 'down' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse self-center mr-0.5`}></span>
                 {data.price.toFixed(2)}
               </span>
            </div>
         ))}
       </div>
    </div>
  );
}

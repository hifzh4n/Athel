"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Market {
  name: string;
  startUtc: number; // 0-23
  endUtc: number;   // 0-23
}

const MARKETS: Market[] = [
  { name: "Sydney", startUtc: 22, endUtc: 7 },
  { name: "Tokyo", startUtc: 0, endUtc: 9 },
  { name: "London", startUtc: 8, endUtc: 17 },
  { name: "New York", startUtc: 13, endUtc: 22 },
];

export function MarketHours() {
  const [currentUtcHour, setCurrentUtcHour] = useState<number>(new Date().getUTCHours());
  const [isWeekend, setIsWeekend] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtcHour(now.getUTCHours());
      const day = now.getUTCDay();
      // Forex market closes Friday 22:00 UTC, opens Sunday 22:00 UTC
      // For simplicity, we can consider Saturday (6) and Sunday before 22:00 UTC as closed.
      if (day === 6 || (day === 0 && now.getUTCHours() < 22) || (day === 5 && now.getUTCHours() >= 22)) {
        setIsWeekend(true);
      } else {
        setIsWeekend(false);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const isMarketOpen = (market: Market) => {
    if (isWeekend) return false;
    
    if (market.startUtc > market.endUtc) {
      // Crosses midnight (e.g. 22:00 to 07:00)
      return currentUtcHour >= market.startUtc || currentUtcHour < market.endUtc;
    }
    return currentUtcHour >= market.startUtc && currentUtcHour < market.endUtc;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-6 bg-card/30 border border-border/50 p-4 rounded-xl glass-panel relative z-10 overflow-hidden">
      <div className="flex items-center gap-2 mr-2">
        <Clock className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm">Market Sessions</span>
      </div>
      
      {MARKETS.map((market) => {
        const isOpen = isMarketOpen(market);
        return (
          <div key={market.name} className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{market.name}</span>
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isOpen ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" : "bg-neutral-600"}`}></div>
          </div>
        );
      })}
    </div>
  );
}

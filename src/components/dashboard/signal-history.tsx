"use client";

import { useSignalStore } from "@/store/useSignalStore";
import { Badge } from "@/components/ui/badge";

export function SignalHistoryCard() {
  const { historySignals } = useSignalStore();

  if (historySignals.length === 0) {
    return <p className="text-muted-foreground text-sm">No recent signals yet.</p>;
  }

  return (
    <div className="space-y-4">
      {historySignals.map((sig) => {
        const isBuy = sig.direction === "BUY";
        const isSell = sig.direction === "SELL";
        
        let badgeColor = "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
        if (isBuy) badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        if (isSell) badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";

        return (
          <div key={sig.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-card/50">
            <div className="flex items-center justify-between">
              <Badge className={`hover:bg-transparent ${badgeColor}`}>
                {sig.direction}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(sig.updatedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground">Entry</span>
              <span>{sig.entryLow.toFixed(2)} - {sig.entryHigh.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground">TP1</span>
              <span className="text-emerald-500">{sig.takeProfit1.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

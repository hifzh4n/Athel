"use client";

import { useSignalStore } from "@/store/useSignalStore";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export function MTFCard() {
  const { activeSignals } = useSignalStore();
  const activeSignal = activeSignals[0]; // Display MTF for the most recent active setup

  if (!activeSignal || !activeSignal.mtf) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Waiting for active setup to analyze timeframe confluence...</p>
      </div>
    );
  }

  const { mtf } = activeSignal;

  const renderBadge = (trend: string) => {
    if (trend === "BULLISH") {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 text-sm"><ArrowUpRight className="w-4 h-4 mr-1" /> Bullish</Badge>;
    }
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 text-sm"><ArrowDownRight className="w-4 h-4 mr-1" /> Bearish</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
        <span className="font-mono text-muted-foreground font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> M5</span>
        {renderBadge(mtf.M5)}
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
        <span className="font-mono text-muted-foreground font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> M15</span>
        {renderBadge(mtf.M15)}
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-primary/20">
        <span className="font-mono text-primary font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> H1 (Macro)</span>
        {renderBadge(mtf.H1)}
      </div>
    </div>
  );
}

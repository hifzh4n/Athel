"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Target, ShieldAlert, Crosshair, Loader2 } from "lucide-react";
import { Signal } from "@/types";

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.direction === "BUY";
  const isSell = signal.direction === "SELL";
  
  let badgeColor = "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  if (isBuy) badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
  if (isSell) badgeColor = "bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]";

  return (
    <div className="space-y-4 h-full flex flex-col relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`hover:bg-transparent ${badgeColor} ${signal.status === 'ACTIVE' ? 'pulse-glow' : ''}`}>
            {signal.status}
          </Badge>
          <span className="text-sm text-muted-foreground font-mono">{signal.symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/50 text-primary font-bold shadow-[0_0_10px_var(--primary)] neon-text">
            GRADE {signal.grade}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border flex-1">
        <div className="space-y-1 p-2 rounded inset-panel">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Crosshair className="w-3 h-3" /> Entry Zone
          </span>
          <p className="text-lg font-mono font-medium text-foreground tracking-wider">
            {signal.entryLow.toFixed(2)} - {signal.entryHigh.toFixed(2)}
          </p>
        </div>
        <div className="space-y-1 p-2 rounded inset-panel">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" /> Take Profit
          </span>
          <div className="space-y-1">
            <p className="text-sm font-mono flex justify-between tracking-wider">
              <span>TP1</span> <span className="text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]">{signal.takeProfit1.toFixed(2)}</span>
            </p>
            <p className="text-sm font-mono flex justify-between tracking-wider">
              <span>TP2</span> <span className="text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]">{signal.takeProfit2.toFixed(2)}</span>
            </p>
          </div>
        </div>
        <div className="space-y-1 p-2 rounded inset-panel">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" /> Stop Loss
          </span>
          <p className="text-lg font-mono text-red-400 tracking-wider drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]">{signal.stopLoss.toFixed(2)}</p>
        </div>
        <div className="space-y-1 p-2 rounded inset-panel">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-primary" /> Risk/Reward
          </span>
          <p className="text-lg font-mono text-primary neon-text tracking-wider">
            1 : {signal.riskReward?.toFixed(1) ?? '—'}
          </p>
        </div>
      </div>
      
      <div className="pt-3 mt-auto border-t border-border space-y-2">
        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden border border-border">
          <div className="bg-primary h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_var(--primary)]" style={{ width: `${signal.confidence}%` }}></div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Confidence: <span className="text-primary font-medium">{signal.confidence}%</span> ({signal.confluences ?? '—'}/8 factors)</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Detected: {signal.createdAt ? new Date(signal.createdAt).toLocaleTimeString() : 'Unknown'}</p>
          {signal.status === 'ACTIVE' ? (
            <p className="text-xs text-primary font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_var(--primary)]"></span> Tracking Live</p>
          ) : (
            <p className="text-xs text-muted-foreground">Closed: {new Date(signal.updatedAt || Date.now()).toLocaleTimeString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}

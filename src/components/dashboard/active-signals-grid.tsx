"use client";

import { useEffect } from "react";
import { useSignalStore } from "@/store/useSignalStore";
import { SignalCard } from "./signal-card";
import { Loader2 } from "lucide-react";

export function ActiveSignalsGrid() {
  const { activeSignals, listenToCurrentSignal } = useSignalStore();

  useEffect(() => {
    listenToCurrentSignal();
  }, [listenToCurrentSignal]);

  if (activeSignals.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 rounded-xl glass-panel relative overflow-hidden">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>Scanning the market for new setups...</p>
      </div>
    );
  }

  return (
    <>
      {activeSignals.map((signal) => (
        <div key={signal.id} className="col-span-1 glass-panel rounded-xl p-6 text-card-foreground shadow-sm hover:neon-box transition-all duration-300 relative overflow-hidden">
          <SignalCard signal={signal} />
        </div>
      ))}
    </>
  );
}

"use client";

import { useEffect } from "react";
import { useSignalStore } from "@/store/useSignalStore";
import { Badge } from "@/components/ui/badge";
import { Activity, Power, Server, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminPage() {
  const { signals, activeSignals, historySignals, listenToCurrentSignal, lastPriceUpdate, listenToLivePrice } = useSignalStore();

  useEffect(() => {
    listenToCurrentSignal();
    listenToLivePrice();
  }, [listenToCurrentSignal, listenToLivePrice]);

  const latestSignal = signals[0];
  const secondsAgo = Math.floor((Date.now() - (lastPriceUpdate || 0)) / 1000);
  const isEngineOnline = lastPriceUpdate > 0 && secondsAgo < 120; // 2 minutes

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const todaySignals = signals.filter(s => isToday(s.createdAt) || isToday(s.updatedAt));
  const totalTP = todaySignals.filter(s => s.status === "COMPLETED_TP").length;
  const totalSL = todaySignals.filter(s => s.status === "COMPLETED_SL").length;
  const winRate = totalTP + totalSL > 0 ? Math.round((totalTP / (totalTP + totalSL)) * 100) : 0;

  const formatSecondsAgo = (s: number) => {
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Signals (All Time)", value: signals.length, icon: Activity, color: "text-primary" },
          { label: "Active Now", value: activeSignals.length, icon: Clock, color: "text-primary" },
          { label: "Today's Win Rate", value: `${winRate}%`, icon: CheckCircle2, color: "text-blue-400" },
          { label: "Today's TP", value: totalTP, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Today's SL", value: totalSL, icon: TrendingDown, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color} shrink-0`} />
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Engine Status Card */}
        <div className="glass-panel rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" /> Python Engine Status
            </h2>
            {isEngineOnline ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Power className="w-3 h-3 mr-1" /> Online
              </Badge>
            ) : (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                <Power className="w-3 h-3 mr-1" /> Offline
              </Badge>
            )}
          </div>

          <div className="space-y-3 flex-1">
            {[
              { label: "Last Heartbeat", value: lastPriceUpdate > 0 ? formatSecondsAgo(secondsAgo) : "Never" },
              { label: "Last Signal Time", value: latestSignal ? new Date(latestSignal.updatedAt).toLocaleString() : "—" },
              { label: "Active Tracking", value: `${activeSignals.length} signal(s)`, green: true },
              { label: "Overall Win Rate", value: `${winRate}% (${totalTP}W / ${totalSL}L)`, green: winRate >= 50 },
              { label: "Database Sync", value: "Connected (WebSocket)", green: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center p-3 rounded-lg inset-panel">
                <span className="text-muted-foreground text-sm">{row.label}</span>
                <span className={`text-sm font-medium font-mono ${row.green ? "text-emerald-400" : ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Signals List */}
        <div className="glass-panel rounded-xl p-6 flex flex-col">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" /> Live Active Signals
          </h2>

          {activeSignals.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No active signals currently running.
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {activeSignals.map((sig) => (
                <div key={sig.id} className="p-3 rounded-lg inset-panel flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className={`shrink-0 text-xs ${sig.direction === "BUY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                      {sig.direction === "BUY" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {sig.direction}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground truncate">@ {sig.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground font-mono">
                      SL:{sig.stopLoss?.toFixed(0)} | TP:{sig.takeProfit1?.toFixed(0)}
                    </span>
                    <Badge variant="outline" className="text-primary border-primary/30 text-xs">{sig.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent History */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-primary" /> Recent Closed Signals
        </h2>
        {historySignals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No closed signals yet.</p>
        ) : (
          <div className="space-y-2">
            {historySignals.slice(0, 5).map((sig) => (
              <div key={sig.id} className="p-3 rounded-lg inset-panel flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {sig.status === "COMPLETED_TP" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${sig.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{sig.direction}</span>
                  <span className="font-mono text-xs text-muted-foreground">Entry @ {sig.price?.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {sig.riskReward ? `RR 1:${sig.riskReward.toFixed(1)}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(sig.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

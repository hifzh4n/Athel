"use client";

import { useState, useEffect } from "react";
import { useSignalStore } from "@/store/useSignalStore";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, XCircle, Clock, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

export function SignalsTable() {
  const { signals, listenToCurrentSignal } = useSignalStore();
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    listenToCurrentSignal();
  }, [listenToCurrentSignal]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  const filteredSignals = signals.filter((sig) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return sig.status === "ACTIVE" || sig.status.includes("DEVELOPING");
    if (filter === "COMPLETED") return sig.status.includes("COMPLETED");
    if (filter === "TP") return sig.status === "COMPLETED_TP";
    if (filter === "SL") return sig.status === "COMPLETED_SL";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSignals.length / PAGE_SIZE));
  const paginated = filteredSignals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    if (status === "COMPLETED_TP")
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1"/>TP Hit</Badge>;
    if (status === "COMPLETED_SL")
      return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30"><XCircle className="w-3 h-3 mr-1"/>SL Hit</Badge>;
    return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 pulse-glow"><Clock className="w-3 h-3 mr-1"/>Active</Badge>;
  };

  // Counts for filter badges
  const counts = {
    ALL: signals.length,
    ACTIVE: signals.filter(s => s.status === "ACTIVE").length,
    COMPLETED: signals.filter(s => s.status.includes("COMPLETED")).length,
    TP: signals.filter(s => s.status === "COMPLETED_TP").length,
    SL: signals.filter(s => s.status === "COMPLETED_SL").length,
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-1 md:gap-2 pb-2">
        <Filter className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 pr-4">
          {(["ALL", "ACTIVE", "COMPLETED", "TP", "SL"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary/50"
                  : "bg-black/20 text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
              }`}
            >
              {f === "TP" ? "TP Hit" : f === "SL" ? "SL Hit" : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className={`text-[10px] rounded-full px-1 ${filter === f ? "bg-primary-foreground/20" : "bg-white/10"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl glass-panel overflow-hidden w-full relative">
        <div className="overflow-x-auto w-full pb-2 no-scrollbar">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-muted-foreground uppercase bg-black/30 border-b border-white/5">
              <tr>
                <th className="px-4 py-3 font-medium">Detected</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Direction</th>
                <th className="px-4 py-3 font-medium">Entry Zone</th>
                <th className="px-4 py-3 font-medium">TP1</th>
                <th className="px-4 py-3 font-medium">SL</th>
                <th className="px-4 py-3 font-medium">RR</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    No signals found for this filter.
                  </td>
                </tr>
              ) : (
                paginated.map((sig) => (
                  <tr key={sig.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {new Date(sig.createdAt || sig.updatedAt || Date.now()).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-xs">{sig.symbol}</td>
                    <td className="px-4 py-3">
                      {sig.direction === "BUY" ? (
                        <span className="flex items-center text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded w-fit text-xs border border-emerald-500/20">
                          <ArrowUpRight className="w-3 h-3 mr-1" /> BUY
                        </span>
                      ) : (
                        <span className="flex items-center text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded w-fit text-xs border border-red-500/20">
                          <ArrowDownRight className="w-3 h-3 mr-1" /> SELL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{sig.entryLow?.toFixed(2) ?? '—'} – {sig.entryHigh?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">{sig.takeProfit1?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-red-400">{sig.stopLoss?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      {sig.riskReward ? `1:${sig.riskReward?.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs">{sig.grade}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{getStatusBadge(sig.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredSignals.length)}–{Math.min(page * PAGE_SIZE, filteredSignals.length)} of {filteredSignals.length} signals
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg glass-panel border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg glass-panel border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

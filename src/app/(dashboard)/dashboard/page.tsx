import { ActiveSignalsGrid } from "@/components/dashboard/active-signals-grid";
import { SignalHistoryCard } from "@/components/dashboard/signal-history";
import { MTFCard } from "@/components/dashboard/mtf-card";
import { AIAnalysisCard } from "@/components/dashboard/ai-analysis-card";
import { MarketSentimentCard } from "@/components/dashboard/market-sentiment-card";
import { Sparkles, Globe } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Active Setups</h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <ActiveSignalsGrid />
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {/* Card: Market Sentiment */}
        <div className="col-span-1 glass-panel rounded-xl p-6 text-card-foreground shadow-sm relative overflow-hidden">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Market Sentiment</h2>
          <MarketSentimentCard />
        </div>

        {/* Card: Signal History Preview */}
        <div className="col-span-1 glass-panel rounded-xl p-6 text-card-foreground shadow-sm relative overflow-hidden">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></span> Signal History</h2>
          <SignalHistoryCard />
        </div>

        {/* Card: Multi Timeframe */}
        <div className="col-span-1 glass-panel rounded-xl p-6 text-card-foreground shadow-sm relative overflow-hidden">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></span> Multi Timeframe</h2>
          <MTFCard />
        </div>

        {/* Card: AI Analysis */}
        <div className="col-span-1 glass-panel rounded-xl p-6 text-card-foreground shadow-sm relative overflow-hidden">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary neon-text" /> AI Analysis</h2>
          <AIAnalysisCard />
        </div>
      </div>
    </div>
  );
}

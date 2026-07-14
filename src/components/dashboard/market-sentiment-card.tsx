"use client";

import { useEffect, useState } from "react";
import { Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function MarketSentimentCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sentiment")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch sentiment:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-4 bg-primary/20 rounded w-1/2"></div>
      <div className="h-8 bg-primary/20 rounded w-full"></div>
    </div>;
  }

  if (!data || data.error) {
    return <div className="text-muted-foreground text-sm">Failed to load macro sentiment.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Global Macro</span>
        <div className={`px-2 py-1 rounded text-xs font-bold ${
          data.label.includes("Bullish") ? "bg-green-500/20 text-green-400" :
          data.label.includes("Bearish") ? "bg-red-500/20 text-red-400" :
          "bg-gray-500/20 text-gray-400"
        }`}>
          {data.label}
        </div>
      </div>
      
      <div className="text-2xl font-bold flex items-center gap-2">
        {data.label.includes("Bullish") ? <TrendingUp className="text-green-400" /> :
         data.label.includes("Bearish") ? <TrendingDown className="text-red-400" /> :
         <Minus className="text-gray-400" />}
        {data.score > 0 ? "+" : ""}{(data.score * 100).toFixed(1)}
      </div>

      <div className="mt-2 space-y-2">
        <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">Top Headlines</span>
        {data.headlines?.slice(0, 2).map((h: any, i: number) => (
          <a key={i} href={h.url} target="_blank" rel="noreferrer" className="block text-xs hover:text-primary transition-colors line-clamp-2">
            • {h.title}
          </a>
        ))}
      </div>
    </div>
  );
}

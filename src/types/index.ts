export interface Signal {
  id?: string;
  symbol: string;
  direction: "BUY" | "SELL";
  status: string;
  price: number;
  confidence: number;
  grade: "A+" | "A" | "B" | "C" | "MANUAL";
  riskReward?: number;
  confluences?: number;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  createdAt?: string;
  updatedAt: string;
  mtf?: {
    M5: string;
    M15: string;
    H1: string;
  };
  aiAnalysis?: string;
}


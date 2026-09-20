export type SymbolPair = 'SOLUSDT' | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'XRPUSDT' | 'DOGEUSDT';

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
}

export interface KlinePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type StrategyType = 'GRID' | 'DCA' | 'RSI_REVERSAL' | 'SCALP_PRO';

export interface BotSettings {
  strategy: StrategyType;
  symbol: SymbolPair;
  initialBalance: number; // e.g. 7.40 USDT
  orderSizePct: number;   // e.g. 20 (always 20% of balance per trade)
  orderSizeUsdt: number;  // e.g. 1.48 USDT per tranche (20% of $7.40)
  takeProfitPct: number;  // e.g. 2.0%
  stopLossPct: number;    // e.g. 1.5%
  timeframe: '1m' | '5m' | '15m' | '1h'; // default 5m
  gridLevels: number;     // e.g. 4
  gridLowerPrice: number;
  gridUpperPrice: number;
  dipTriggerPct: number;  // For DCA: buy on 1.5% dip
  feePct: number;         // 0.1% standard spot fee
  leverage: number;       // 1x (Spot) up to 10x/20x
  scalpEmaFast: number;   // Fast EMA (default 9)
  scalpEmaSlow: number;   // Slow EMA (default 21)
  scalpTrailingStop: boolean; // Trailing profit lock
}

export interface ExecutedOrder {
  id: string;
  timestamp: number;
  symbol: SymbolPair;
  type: 'BUY' | 'SELL';
  price: number;
  amountUsdt: number;
  amountCoin: number;
  feeUsdt: number;
  pnlUsdt?: number;
  pnlPct?: number;
  reason: string;
}

export interface OpenGridOrder {
  id: string;
  type: 'BUY' | 'SELL';
  price: number;
  amountUsdt: number;
  amountCoin: number;
  status: 'PENDING' | 'TRIGGERED';
}

export interface BotState {
  status: 'STOPPED' | 'RUNNING' | 'PAUSED';
  usdtBalance: number;
  cryptoBalance: number;
  avgEntryPrice: number;
  realizedPnl: number;
  totalFeesPaid: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  history: ExecutedOrder[];
  openGridOrders: OpenGridOrder[];
  lastActionTime: number;
  lastCheckPrice: number;
  dcaTranchesUsed: number;
}

export interface AIStrategyAudit {
  riskScore: number;
  verdict: string;
  realisticMonthlyReturn: string;
  feeImpactExplanation: string;
  keyStrengths: string[];
  criticalRisks: string[];
  recommendedAdjustments: string[];
  safetyChecklist: string[];
  botAdviceSummary: string;
}
